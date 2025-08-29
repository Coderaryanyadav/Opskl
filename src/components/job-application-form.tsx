'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { FileUpload } from '@/components/ui/file-upload';
import { submitApplication } from '@/lib/api/jobs';
import { getCurrentUser } from '@/lib/auth';
import { showErrorToast } from '@/lib/error-handler';

// Form schema
const applicationFormSchema = z.object({
  coverLetter: z.string().min(10, {
    message: 'Cover letter must be at least 10 characters.',
  }),
  expectedSalary: z.coerce.number().min(0, {
    message: 'Expected salary must be a positive number.',
  }),
  availability: z.string().min(1, {
    message: 'Please provide your availability.',
  }),
  resumeUrl: z.string().min(1, {
    message: 'Please upload your resume.',
  }),
  additionalInfo: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface JobApplicationFormProps {
  jobId: string;
}

export function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const defaultValues: Partial<ApplicationFormValues> = {
    coverLetter: '',
    expectedSalary: 0,
    availability: '',
    resumeUrl: '',
    additionalInfo: '',
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      // In a real app, you would upload the file to your server or storage service
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }
      
      const { url } = await response.json();
      
      // Update the form field with the file URL
      form.setValue('resumeUrl', url, { shouldValidate: true });
      setUploadProgress(100);
      
      return url;
    } catch (error) {
      console.error('File upload error:', error);
      showErrorToast(error, 'Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [form]);
  
  // Handle file change
  const handleFileChange = async (file: File | null) => {
    if (!file) {
      form.setValue('resumeUrl', '', { shouldValidate: true });
      setFile(null);
      return;
    }
    
    setFile(file);
    try {
      await handleFileUpload(file);
    } catch (error) {
      setFile(null);
    }
  };
  
  // Handle file remove
  const handleRemoveFile = () => {
    setFile(null);
    form.setValue('resumeUrl', '', { shouldValidate: true });
  };

  async function onSubmit(data: ApplicationFormValues) {
    try {
      setIsSubmitting(true);
      
      // Get current user to check if they're logged in
      const user = await getCurrentUser();
      
      if (!user) {
        router.push(`/auth/signin?callbackUrl=/jobs/${jobId}`);
        return;
      }
      
      // Submit the application
      await submitApplication(jobId, {
        coverLetter: data.coverLetter,
        expectedSalary: data.expectedSalary,
        availability: data.availability,
        resumeUrl: data.resumeUrl,
        additionalInfo: data.additionalInfo,
      });
      
      // Show success message
      toast({
        title: 'Application submitted!',
        description: 'Your application has been submitted successfully.',
      });
      
      // Refresh the page to show the application status
      router.refresh();
      
    } catch (error) {
      console.error('Error submitting application:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive',
      });
      
    } finally {
      setIsSubmitting(false);
    }
  }

  // If the form is not open, show the apply button
  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Icons.send className="h-4 w-4 mr-2" />
        Apply Now
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Apply for this position</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              <Icons.x className="h-5 w-5" />
            </Button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Resume *</Label>
                  <FileUpload
                    onUpload={handleFileUpload}
                    onFileChange={handleFileChange}
                    onRemove={handleRemoveFile}
                    disabled={isSubmitting || isUploading}
                    label="Upload your resume"
                    description="PDF, DOC, DOCX (max 5MB)"
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6"
                  />
                  {form.formState.errors.resumeUrl && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.resumeUrl.message}
                    </p>
                  )}
                </div>
                
                {/* Expected Salary */}
                <FormField
                  control={form.control}
                  name="expectedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Salary (INR) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            type="number"
                            min="0"
                            className="pl-8"
                            placeholder="e.g., 50000"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Availability */}
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Immediately, 2 weeks notice, etc."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Cover Letter */}
                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Letter *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us why you're a good fit for this position..."
                          className="min-h-[150px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Customize your cover letter for this position.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Additional Information */}
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information you'd like to share..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploading}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading...' : 'Submitting...'}
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
