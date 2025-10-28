import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Calendar, User, Phone, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ClaimForm from '@/components/ClaimForm';

interface Item {
  id: string;
  user_id: string;
  title: string;
  type: 'Lost' | 'Found';
  description: string;
  location: string;
  contact: string;
  image_url?: string[];
  status: string;
  created_at: string;
}

const ItemDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data as Item);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Item not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.user_id;
  const canClaim = !isOwner && item.type === 'Found' && item.status === 'Available' && user;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="glass-card border-card-border">
          {item.image_url && item.image_url.length > 0 && (
            <div className="rounded-t-xl overflow-hidden">
              {item.image_url.length === 1 ? (
                <div className="h-96">
                  <img 
                    src={item.image_url[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {item.image_url.map((url, index) => (
                      <CarouselItem key={index}>
                        <div className="h-96">
                          <img 
                            src={url} 
                            alt={`${item.title} - Image ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              )}
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-4xl font-bold mb-4">{item.title}</CardTitle>
                <div className="flex gap-2 mb-4">
                  <Badge className={item.type === 'Lost' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-accent/20 text-accent border-accent/30'}>
                    {item.type}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {item.status}
                  </Badge>
                </div>
              </div>
              
              {isOwner && (
                <div className="flex gap-2">
                  <Link to={`/edit-item/${item.id}`}>
                    <Button variant="glass" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 glass-card rounded-lg">
                <MapPin className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{item.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 glass-card rounded-lg">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted On</p>
                  <p className="font-medium">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 glass-card rounded-lg">
                <Phone className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{item.contact}</p>
                </div>
              </div>
            </div>

            {canClaim && !showClaimForm && (
              <Button 
                variant="default" 
                size="lg" 
                className="w-full"
                onClick={() => setShowClaimForm(true)}
              >
                Claim This Item
              </Button>
            )}

            {showClaimForm && (
              <ClaimForm 
                itemId={item.id} 
                onSuccess={() => {
                  setShowClaimForm(false);
                  toast.success('Claim submitted successfully!');
                }} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ItemDetailsPage;
