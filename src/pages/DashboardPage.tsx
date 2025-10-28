import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LayoutDashboard, Package, MessageSquare } from 'lucide-react';
import ItemCard from '@/components/ItemCard';

interface Item {
  id: string;
  title: string;
  type: 'Lost' | 'Found';
  description: string;
  location: string;
  image_url?: string[];
  status: string;
  created_at: string;
}

interface Claim {
  id: string;
  message: string;
  claim_status: string;
  created_at: string;
  items: {
    id: string;
    title: string;
    type: string;
  };
  profiles: {
    name: string;
    email: string;
  };
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [claimsOnMyItems, setClaimsOnMyItems] = useState<Claim[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setMyItems((items as Item[]) || []);

      // Fetch claims on user's items
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          items!inner(id, title, type, user_id),
          profiles!claims_claimant_id_fkey(name, email)
        `)
        .eq('items.user_id', user?.id);

      if (claimsError) throw claimsError;
      setClaimsOnMyItems(claims || []);

      // Fetch user's claims
      const { data: userClaims, error: userClaimsError } = await supabase
        .from('claims')
        .select(`
          *,
          items(id, title, type),
          profiles!claims_claimant_id_fkey(name, email)
        `)
        .eq('claimant_id', user?.id);

      if (userClaimsError) throw userClaimsError;
      setMyClaims(userClaims || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAction = async (claimId: string, action: 'Approved' | 'Rejected', itemId: string) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ claim_status: action })
        .eq('id', claimId);

      if (error) throw error;

      if (action === 'Approved') {
        // Update item status to Returned
        const { error: itemError } = await supabase
          .from('items')
          .update({ status: 'Returned' })
          .eq('id', itemId);

        if (itemError) throw itemError;
      }

      toast.success(`Claim ${action.toLowerCase()} successfully`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update claim');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-8 h-8 text-accent" />
          <h1 className="text-4xl font-bold text-primary">
            Dashboard
          </h1>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 glass-card mb-8">
            <TabsTrigger value="items">
              <Package className="w-4 h-4 mr-2" />
              My Items
            </TabsTrigger>
            <TabsTrigger value="claims-received">
              <MessageSquare className="w-4 h-4 mr-2" />
              Claims Received
            </TabsTrigger>
            <TabsTrigger value="my-claims">
              <MessageSquare className="w-4 h-4 mr-2" />
              My Claims
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            {myItems.length === 0 ? (
              <Card className="glass-card border-card-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't posted any items yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    type={item.type}
                    description={item.description}
                    location={item.location}
                    imageUrl={item.image_url || undefined}
                    status={item.status}
                    createdAt={item.created_at}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="claims-received">
            {claimsOnMyItems.length === 0 ? (
              <Card className="glass-card border-card-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No claims received yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {claimsOnMyItems.map((claim) => (
                  <Card key={claim.id} className="glass-card border-card-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{claim.items.title}</CardTitle>
                          <CardDescription>
                            Claimed by {claim.profiles.name} ({claim.profiles.email})
                          </CardDescription>
                        </div>
                        <Badge className={
                          claim.claim_status === 'Approved' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : claim.claim_status === 'Rejected'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>
                          {claim.claim_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{claim.message}</p>
                      {claim.claim_status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleClaimAction(claim.id, 'Approved', claim.items.id)}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleClaimAction(claim.id, 'Rejected', claim.items.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-claims">
            {myClaims.length === 0 ? (
              <Card className="glass-card border-card-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">You haven't made any claims yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myClaims.map((claim) => (
                  <Card key={claim.id} className="glass-card border-card-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{claim.items.title}</CardTitle>
                        <Badge className={
                          claim.claim_status === 'Approved' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : claim.claim_status === 'Rejected'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>
                          {claim.claim_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">Your message:</p>
                      <p className="text-muted-foreground">{claim.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
