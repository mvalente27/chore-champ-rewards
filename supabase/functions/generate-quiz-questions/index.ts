import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizPerformance {
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  difficultyBreakdown: {
    easy: { attempts: number; correct: number };
    medium: { attempts: number; correct: number };
    hard: { attempts: number; correct: number };
  };
}

function determineDifficulty(performance: QuizPerformance): string {
  const { accuracyRate, difficultyBreakdown } = performance;
  
  // New user or very few attempts - start easy
  if (performance.totalAttempts < 5) return 'easy';
  
  // Calculate weighted score based on recent performance
  const easyAccuracy = difficultyBreakdown.easy.attempts > 0 
    ? difficultyBreakdown.easy.correct / difficultyBreakdown.easy.attempts 
    : 0;
  const mediumAccuracy = difficultyBreakdown.medium.attempts > 0 
    ? difficultyBreakdown.medium.correct / difficultyBreakdown.medium.attempts 
    : 0;
  const hardAccuracy = difficultyBreakdown.hard.attempts > 0 
    ? difficultyBreakdown.hard.correct / difficultyBreakdown.hard.attempts 
    : 0;

  // Progress to harder questions if doing well
  if (accuracyRate >= 0.8 && easyAccuracy >= 0.9) {
    if (mediumAccuracy >= 0.8 && difficultyBreakdown.medium.attempts >= 3) {
      return 'hard';
    }
    return 'medium';
  }
  
  if (accuracyRate >= 0.6) {
    return 'medium';
  }
  
  return 'easy';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requesting user's profile
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate age tier from birth_date
    const getAgeTier = (birthDate: string | null): string => {
      if (!birthDate) return 'explorer';
      const birth = new Date(birthDate);
      const now = new Date();
      const age = now.getFullYear() - birth.getFullYear();
      if (age <= 8) return 'explorer';
      if (age <= 12) return 'builder';
      return 'achiever';
    };

    const ageTier = getAgeTier(profile.birth_date);

    // Get kid's quiz performance for their age tier
    const { data: attempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("*, quiz_questions(difficulty, age_tier)")
      .eq("profile_id", profile.id);

    // Filter attempts for current age tier only
    const tierAttempts = attempts?.filter(a => a.quiz_questions?.age_tier === ageTier) || [];

    // Calculate performance metrics
    const performance: QuizPerformance = {
      totalAttempts: tierAttempts.length,
      correctAttempts: tierAttempts.filter(a => a.is_correct).length,
      accuracyRate: 0,
      difficultyBreakdown: {
        easy: { attempts: 0, correct: 0 },
        medium: { attempts: 0, correct: 0 },
        hard: { attempts: 0, correct: 0 },
      }
    };

    if (performance.totalAttempts > 0) {
      performance.accuracyRate = performance.correctAttempts / performance.totalAttempts;
      
      tierAttempts.forEach(a => {
        const diff = a.quiz_questions?.difficulty || 'easy';
        if (diff in performance.difficultyBreakdown) {
          performance.difficultyBreakdown[diff as keyof typeof performance.difficultyBreakdown].attempts++;
          if (a.is_correct) {
            performance.difficultyBreakdown[diff as keyof typeof performance.difficultyBreakdown].correct++;
          }
        }
      });
    }

    const targetDifficulty = determineDifficulty(performance);
    const pointsForDifficulty = targetDifficulty === 'hard' ? 20 : targetDifficulty === 'medium' ? 15 : 10;

    // Get existing question IDs for this age tier to avoid duplicates
    const { data: existingQuestions } = await supabaseAdmin
      .from("quiz_questions")
      .select("question")
      .eq("age_tier", ageTier);
    
    const existingQuestionTexts = existingQuestions?.map(q => q.question.toLowerCase()) || [];

    // Generate new questions using AI - customize by age tier
    const categoryByTier: Record<string, string[]> = {
      explorer: ['saving', 'coins', 'piggy banks', 'allowance'],
      builder: ['budgeting', 'spending', 'earning', 'needs vs wants'],
      achiever: ['investing', 'compound interest', 'stocks', 'financial planning']
    };
    const categories = categoryByTier[ageTier] || categoryByTier.explorer;
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    // Age-appropriate prompts
    const ageDescriptions: Record<string, string> = {
      explorer: 'young children ages 5-8. Use simple words, fun examples like toys and candy, and basic counting/math.',
      builder: 'children ages 9-12. Include practical examples like saving for games, doing chores, and simple budgeting.',
      achiever: 'teenagers ages 13-18. Cover real-world concepts like investing, interest rates, and financial planning.'
    };

    const systemPrompt = `You are a financial literacy educator for ${ageDescriptions[ageTier]}

Rules:
- Questions should be age-appropriate and fun
- For 'easy' difficulty: basic concepts appropriate for the age group
- For 'medium' difficulty: moderate complexity for the age group  
- For 'hard' difficulty: challenging but still age-appropriate
- Each question must have exactly 4 answer options
- Only ONE answer should be correct
- Make questions engaging and relatable`;

    const userPrompt = `Generate 3 unique ${targetDifficulty} difficulty quiz questions about "${randomCategory}" for ${ageTier === 'explorer' ? 'young kids (5-8)' : ageTier === 'builder' ? 'kids (9-12)' : 'teenagers (13-18)'}.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "category": "${randomCategory}",
    "difficulty": "${targetDifficulty}"
  }
]

The correct_answer is the index (0-3) of the correct option.
Make sure questions are different from these existing ones: ${existingQuestionTexts.slice(0, 10).join(', ')}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate questions");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from AI response
    let questions;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Validate and insert questions
    const validQuestions = questions.filter((q: any) => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correct_answer === 'number' &&
      q.correct_answer >= 0 && 
      q.correct_answer <= 3 &&
      !existingQuestionTexts.includes(q.question.toLowerCase())
    );

    if (validQuestions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new unique questions generated", questionsAdded: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new questions with age tier
    const questionsToInsert = validQuestions.map((q: any) => ({
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      category: q.category || randomCategory,
      difficulty: q.difficulty || targetDifficulty,
      points: pointsForDifficulty,
      age_tier: ageTier,
    }));

    const { data: insertedQuestions, error: insertError } = await supabaseAdmin
      .from("quiz_questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save questions");
    }

    console.log(`Generated ${insertedQuestions?.length} new ${targetDifficulty} ${ageTier} questions for profile ${profile.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsAdded: insertedQuestions?.length || 0,
        difficulty: targetDifficulty,
        ageTier: ageTier,
        performance: {
          accuracy: Math.round(performance.accuracyRate * 100),
          totalAttempts: performance.totalAttempts
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
