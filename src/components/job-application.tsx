'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';

const applicationFormSchema = z.object({
  coverLetter: z.string().min(10, {
    message: 'Cover letter must be at least 10 characters.',
  }),
  expectedSalary: z.string().min(1, {
    message: 'Please enter your expected salary.',
  }),
  availability: z.string().min(1, {
    message: 'Please specify your availability.',
  }),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface JobApplicationProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  defaultValues?: Partial<ApplicationFormValues>;
}

export function JobApplication({
  jobId,
  jobTitle,
  companyName,
  defaultValues,
}: JobApplicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      coverLetter: defaultValues?.coverLetter || `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${companyName}. `,
      expectedSalary: defaultValues?.expectedSalary || '',
      availability: defaultValues?.availability || 'Immediately',
    },
  });

  async function onSubmit(data: ApplicationFormValues) {
    setIsLoading(true);
    
    try {
      // In a real app, you would upload the resume file and submit the application
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate API call
      console.log('Submitting application:', {
        jobId,
        ...data,
        resumeFile: resumeFile?.name,
      });
      
      toast({
        title: 'Application submitted!',
        description: `Your application for ${jobTitle} has been submitted successfully.`,
      });
      
      // Redirect to applications page after a short delay
      setTimeout(() => {
        router.push('/talent/applications');
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Apply for {jobTitle}</h2>
        <p className="text-muted-foreground">
          At {companyName}
        </p>
      </div>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Resume Upload */}
          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF, DOC, DOCX)</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              {resumeFile && (
                <span className="text-sm text-muted-foreground">
                  {resumeFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {!resumeFile ? 'No file selected' : ''}
            </p>
          </div>
          
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              placeholder="Write a cover letter explaining why you're a good fit for this position..."
              className="min-h-[200px]"
              {...form.register('coverLetter')}
            />
            {form.formState.errors.coverLetter && (
              <p className="text-sm text-red-500">
                {form.formState.errors.coverLetter.message}
              </p>
            )}
          </div>
          
          {/* Expected Salary */}
          <div className="space-y-2">
            <Label htmlFor="expectedSalary">Expected Salary (per month)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="expectedSalary"
                type="number"
                placeholder="e.g. 50000"
                className="pl-8"
                {...form.register('expectedSalary')}
              />
            </div>
            {form.formState.errors.expectedSalary && (
              <p className="text-sm text-red-500">
                {form.formState.errors.expectedSalary.message}
              </p>
            )}
          </div>
          
          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              placeholder="e.g. Immediately, 2 weeks notice, etc."
              {...form.register('availability')}
            />
            {form.formState.errors.availability && (
              <p className="text-sm text-red-500">
                {form.formState.errors.availability.message}
              </p>
            )}
          </div>
          
          {/* Additional Questions */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Additional Questions</h3>
            
            <div className="space-y-2">
              <Label>
                How many years of experience do you have in this field?
              </Label>
              <Input placeholder="e.g. 3" type="number" min="0" />
            </div>
            
            <div className="space-y-2">
              <Label>
                Do you have any relevant certifications? (Optional)
              </Label>
              <Textarea 
                placeholder="List any relevant certifications you have..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !resumeFile}>
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.send className="mr-2 h-4 w-4" />
            )}
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
