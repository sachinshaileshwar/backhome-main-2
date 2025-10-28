import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ItemCardProps {
  id: string;
  title: string;
  type: 'Lost' | 'Found';
  description: string;
  location: string;
  imageUrl?: string[];
  status: string;
  createdAt: string;
}

const ItemCard = ({ id, title, type, description, location, imageUrl, status, createdAt }: ItemCardProps) => {
  const statusConfig = {
    Available: { emoji: '🟢', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    Claimed: { emoji: '⏳', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    Returned: { emoji: '✅', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  };

  const typeColor = type === 'Lost' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-accent/20 text-accent border-accent/30';
  const displayImage = imageUrl && imageUrl.length > 0 ? imageUrl[0] : null;

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group">
      {displayImage && (
        <div className="h-48 overflow-hidden relative">
          <img 
            src={displayImage} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {imageUrl && imageUrl.length > 1 && (
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
              +{imageUrl.length - 1} more
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <div className="flex gap-2">
            <Badge className={typeColor}>
              <Tag className="w-3 h-3 mr-1" />
              {type}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-accent" />
            {location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 text-accent" />
            {new Date(createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={statusConfig[status as keyof typeof statusConfig].color}>
            {statusConfig[status as keyof typeof statusConfig].emoji} {status}
          </Badge>
          
          <Link to={`/item/${id}`}>
            <Button variant="default" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
