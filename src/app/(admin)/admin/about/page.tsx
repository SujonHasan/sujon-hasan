"use client";

import { useState, useEffect } from "react";
import { useApi, useApiMutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/image-upload";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormSkeleton } from "@/components/admin/loading-skeleton";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
}

interface AboutData {
  name: string;
  tagline: string;
  bio: string;
  heroDescription: string;
  profileImage: string;
  resumeUrl: string;
  stats: StatItem[];
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    website: string;
  };
}

export default function AboutPage() {
  const { data: about, isLoading: loading } = useApi<AboutData>("/api/about");
  const { apiRequest } = useApiMutate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<AboutData>({
    name: "",
    tagline: "",
    bio: "",
    heroDescription: "",
    profileImage: "",
    resumeUrl: "",
    stats: [],
    socialLinks: {
      github: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      website: "",
    },
  });

  useEffect(() => {
    if (about) {
      setForm({
        name: about.name || "",
        tagline: about.tagline || "",
        bio: about.bio || "",
        heroDescription: about.heroDescription || "",
        profileImage: about.profileImage || "",
        resumeUrl: about.resumeUrl || "",
        stats: about.stats || [],
        socialLinks: {
          github: about.socialLinks?.github || "",
          linkedin: about.socialLinks?.linkedin || "",
          twitter: about.socialLinks?.twitter || "",
          facebook: about.socialLinks?.facebook || "",
          website: about.socialLinks?.website || "",
        },
      });
    }
  }, [about]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest("/api/about", "PUT", form);
      toast({ title: "Success", description: "About section updated successfully" });
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStat = () => {
    setForm({ ...form, stats: [...form.stats, { label: "", value: "" }] });
  };

  const removeStat = (index: number) => {
    setForm({ ...form, stats: form.stats.filter((_, i) => i !== index) });
  };

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const updated = [...form.stats];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, stats: updated });
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">About Section</h1>
        <p className="text-muted-foreground">Manage your about page content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Hero Description</Label>
              <Textarea
                value={form.heroDescription}
                onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <RichTextEditor value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Profile Image</CardTitle></CardHeader>
          <CardContent>
            <ImageUpload
              value={form.profileImage}
              onChange={(v) => setForm({ ...form, profileImage: v })}
              folder="profile"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resume</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Resume URL</Label>
              <Input value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stats</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addStat}>
                <Plus className="h-4 w-4 mr-1" /> Add Stat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.stats.length === 0 && (
              <p className="text-sm text-muted-foreground">No stats added yet. Click &quot;Add Stat&quot; to get started.</p>
            )}
            {form.stats.map((stat, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={stat.label}
                    onChange={(e) => updateStat(index, "label", e.target.value)}
                    placeholder="e.g. Years of Experience"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => updateStat(index, "value", e.target.value)}
                    placeholder="e.g. 5+"
                  />
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeStat(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input
                  value={form.socialLinks.github}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, github: e.target.value } })}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={form.socialLinks.linkedin}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter</Label>
                <Input
                  value={form.socialLinks.twitter}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={form.socialLinks.facebook}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, facebook: e.target.value } })}
                  placeholder="https://facebook.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={form.socialLinks.website}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, website: e.target.value } })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
