import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';

interface ClaimFormProps {
  itemId: string;
  onSuccess: () => void;
}

const claimSchema = z.object({
  message: z.string().min(10, "Please provide at least 10 characters of proof").max(500),
});

const ClaimForm = ({ itemId, onSuccess }: ClaimFormProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const validated = claimSchema.parse({ message });

      const { error: submitError } = await supabase
        .from('claims')
        .insert([{
          item_id: itemId,
          claimant_id: user?.id,
          message: validated.message,
        }]);

      if (submitError) throw submitError;

      toast.success('Claim submitted successfully!');
      onSuccess();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        toast.error('Failed to submit claim. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="glass-card border-card-border">
      <CardHeader>
        <CardTitle>Claim This Item</CardTitle>
        <CardDescription>
          Provide details to prove this item belongs to you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Proof of Ownership *</Label>
            <Textarea
              id="message"
              placeholder="Describe unique features, purchase details, or other proof..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass-card min-h-32"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            variant="default"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClaimForm;
