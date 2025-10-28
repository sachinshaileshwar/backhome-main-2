import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Upload, X } from 'lucide-react';
import { z } from 'zod';

const itemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  type: z.enum(['Lost', 'Found']),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  location: z.string().min(3, "Location must be at least 3 characters").max(200),
  contact: z.string().min(5, "Contact info must be at least 5 characters").max(200),
});

const AddItemPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'Lost' as 'Lost' | 'Found',
    description: '',
    location: '',
    contact: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imageFiles.length + files.length > 5) {
      toast.error('You can upload up to 5 images');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0 || !user) return [];

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        return data.publicUrl;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload one or more images');
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const validated = itemSchema.parse(formData);

      const imageUrls = imageFiles.length > 0 ? await uploadImages() : [];

      const { error } = await supabase
        .from('items')
        .insert([{
          user_id: user?.id,
          title: validated.title,
          type: validated.type,
          description: validated.description,
          location: validated.location,
          contact: validated.contact,
          image_url: imageUrls.length > 0 ? imageUrls : null,
        }]);

      if (error) throw error;

      toast.success('Item reported successfully!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to report item. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="glass-card border-card-border">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">
              Report an Item
            </CardTitle>
            <CardDescription>
              Help reunite lost items with their owners or claim found items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blue Backpack, iPhone 13"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass-card"
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v as 'Lost' | 'Found' })}
                >
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Found">Found</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-card min-h-32"
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Central Park, Building A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="glass-card"
                />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Info *</Label>
                <Input
                  id="contact"
                  placeholder="Email or phone number"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="glass-card"
                />
                {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Upload Images (Optional - Max 5)</Label>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative glass-card rounded-lg p-2">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-3 right-3"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {imagePreviews.length < 5 && (
                  <div className="glass-card rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors">
                    <label htmlFor="image" className="flex flex-col items-center justify-center p-8 cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">
                        {imagePreviews.length > 0 ? 'Add more images' : 'Click to upload images'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB each ({imagePreviews.length}/5)</p>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="default"
                disabled={submitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                {submitting ? 'Reporting...' : 'Report Item'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddItemPage;
