import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ItemCard from '@/components/ItemCard';
import { Search, Sparkles, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

const HomePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Lost' | 'Found'>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    // Add scroll animation observer after items are loaded
    if (loading || items.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, items]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'Available')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
        throw error;
      }
      console.log('Fetched items:', data);
      setItems((data as Item[]) || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 mb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in">
            <Search className="w-16 h-16 text-primary" />
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in text-foreground">
            Lost & Found Portal
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in-up max-w-2xl mx-auto">
            Reuniting people with their belongings. Report what you've lost or found, 
            and help make someone's day brighter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
            {user ? (
              <Link to="/add-item">
                <Button size="lg" variant="default" className="text-lg px-10 py-7 hover:scale-105 transition-transform">
                  Report an Item
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" variant="default" className="text-lg px-10 py-7 hover:scale-105 transition-transform">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 hover:scale-105 transition-transform">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex justify-center mt-12 animate-bounce">
            <ArrowDown className="w-6 h-6 text-primary" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 mb-16 scroll-animate opacity-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl font-bold text-primary mb-2">{items.length}</div>
            <div className="text-muted-foreground">Active Items</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl font-bold text-primary mb-2">{items.filter(i => i.type === 'Found').length}</div>
            <div className="text-muted-foreground">Found Items</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-transform">
            <div className="text-4xl font-bold text-primary mb-2">{items.filter(i => i.type === 'Lost').length}</div>
            <div className="text-muted-foreground">Lost Items</div>
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="container mx-auto px-4 scroll-animate opacity-0">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-6 text-center">Recent Items</h2>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 glass-card">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="Lost">Lost</TabsTrigger>
              <TabsTrigger value="Found">Found</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <p className="text-muted-foreground text-lg">No items found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id} 
                className="scroll-animate opacity-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ItemCard
                  id={item.id}
                  title={item.title}
                  type={item.type}
                  description={item.description}
                  location={item.location}
                  imageUrl={item.image_url || undefined}
                  status={item.status}
                  createdAt={item.created_at}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
