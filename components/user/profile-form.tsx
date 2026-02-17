'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/app/actions/profile';
import { useTransition } from 'react';
import { toast } from 'sonner';
import type { User } from '@/lib/db/schema';

export function ProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateProfile(formData);
        toast.success('Profile updated');
      } catch {
        toast.error('Failed to update profile');
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="major">Major</Label>
          <Input id="major" name="major" defaultValue={user.major || ''} placeholder="e.g. Computer Science" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="classYear">Class Year</Label>
          <Input id="classYear" name="classYear" defaultValue={user.classYear || ''} placeholder="e.g. 2026" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={user.phone || ''} placeholder="e.g. (617) 555-1234" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={user.location || ''} placeholder="e.g. Cambridge, MA" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interests">Interests</Label>
        <Input id="interests" name="interests" defaultValue={user.interests || ''} placeholder="e.g. AI, robotics, coffee" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={user.bio || ''} placeholder="Tell us about yourself..." rows={4} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
