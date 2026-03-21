import { ChoreCard } from '@/components/ChoreCard';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Check } from 'lucide-react';
import { Chore as LegacyChore } from '@/types/chores';
import { ChoreStatus, ChoreClaim, ChoreClaimStatus } from '@/types/database';

interface Chore {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  reward_value: number;
  icon: string | null;
  status: ChoreStatus;
  assigned_to: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

interface ChoresViewProps {
  chores: Chore[];
  myClaims?: ChoreClaim[];
  deniedClaims?: (ChoreClaim & { chore?: Chore })[];
  isParent: boolean;
  onClaim: (choreId: string) => void;
  onComplete: (choreId: string, claimId: string) => void;
  onAcknowledgeDenial?: (claimId: string) => void;
  onApprove?: (id: string) => void;
  onEdit?: (chore: LegacyChore) => void;
  onAddChore: () => void;
}

// Convert database chores to legacy format for ChoreCard
const convertToLegacyChore = (chore: Chore): LegacyChore => ({
  id: chore.id,
  title: chore.title,
  description: chore.description || '',
  reward: { type: 'cash', value: chore.reward_value, unit: '' },
  difficulty: chore.reward_value >= 5 ? 'hard' : chore.reward_value >= 2 ? 'medium' : 'easy',
  icon: chore.icon,
  isCompleted: false, // Chores are now templates, always available
  assignedTo: undefined,
  completedAt: undefined,
});

// Get the claim status for a chore for the current user
const getMyClaimStatus = (choreId: string, myClaims: ChoreClaim[]): { status: ChoreClaimStatus | null; claimId: string | null } => {
  const claim = myClaims.find(c => c.chore_id === choreId && c.status !== 'completed');
  return claim ? { status: claim.status as ChoreClaimStatus, claimId: claim.id } : { status: null, claimId: null };
};

export function ChoresView({
  chores,
  myClaims = [],
  deniedClaims = [],
  isParent,
  onClaim,
  onComplete,
  onAcknowledgeDenial,
  onApprove,
  onEdit,
  onAddChore,
}: ChoresViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          {isParent ? 'All Chores' : 'Available Chores'}
        </h2>
        {isParent && (
          <Button 
            variant="default" 
            size="sm"
            onClick={onAddChore}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        )}
      </div>
      
      {chores.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <span className="text-4xl mb-3 block">🎯</span>
          <p className="text-muted-foreground">
            {isParent ? 'No chores yet. Add some!' : 'No chores available right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* For kids: Show denied claims that need acknowledgment */}
          {!isParent && deniedClaims.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Denied Chores
              </h3>
              {deniedClaims.map((claim) => {
                const chore = claim.chore || chores.find(c => c.id === claim.chore_id);
                if (!chore) return null;
                return (
                  <div 
                    key={`denied-${claim.id}`}
                    className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">❌</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{chore.title}</h4>
                        <p className="text-sm text-destructive mt-1">
                          {claim.denial_reason || 'This chore was not approved'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => onAcknowledgeDenial?.(claim.id)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      I Understand
                    </Button>
                  </div>
                );
              })}
            </>
          )}

          {/* For kids: Show their active claims first */}
          {!isParent && myClaims.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Active Tasks</h3>
              {myClaims
                .filter(claim => claim.status !== 'completed' && claim.status !== 'denied')
                .map((claim) => {
                  const chore = chores.find(c => c.id === claim.chore_id);
                  if (!chore) return null;
                  return (
                    <ChoreCard 
                      key={`claim-${claim.id}`}
                      chore={convertToLegacyChore(chore)}
                      onClaim={() => {}} // Already claimed
                      onComplete={() => onComplete(chore.id, claim.id)}
                      isKidView={true}
                      choreStatus={claim.status as ChoreStatus}
                    />
                  );
                })}
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-6">Claim More Chores</h3>
            </>
          )}
          
          {/* Show available chores */}
          {chores.map((chore) => {
            const { status: myClaimStatus, claimId } = getMyClaimStatus(chore.id, myClaims);
            
            // For kids: Skip chores they already have claimed (shown above)
            if (!isParent && myClaimStatus) {
              return null;
            }
            
            return (
              <ChoreCard 
                key={chore.id}
                chore={convertToLegacyChore(chore)}
                onClaim={() => onClaim(chore.id)}
                onComplete={() => {}} // No active claim to complete
                onApprove={isParent ? onApprove : undefined}
                onEdit={isParent ? onEdit : undefined}
                isKidView={!isParent}
                choreStatus="available" // Chores are always available as templates
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
