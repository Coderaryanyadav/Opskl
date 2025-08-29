'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';

// Define form schema
const jobFormSchema = z.object({
  title: z.string().min(5, {
    message: 'Job title must be at least 5 characters.',
  }),
  description: z.string().min(20, {
    message: 'Job description must be at least 20 characters.',
  }),
  requirements: z.string().min(1, {
    message: 'Please list job requirements.',
  }),
  responsibilities: z.string().min(1, {
    message: 'Please list job responsibilities.',
  }),
  location: z.string().min(1, {
    message: 'Please provide a job location.',
  }),
  salary: z.coerce.number().min(0, {
    message: 'Salary must be a positive number.',
  }),
  salaryType: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT']),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP']),
  category: z.enum([
    'Event Management',
    'Wedding Planning',
    'Catering',
    'Photography',
    'Videography',
    'Decor',
    'Entertainment',
    'Security',
    'Other'
  ]),
  isRemote: z.boolean().default(false),
  applicationDeadline: z.string().min(1, {
    message: 'Please provide an application deadline.',
  }),
  benefits: z.string().optional(),
  experienceRequired: z.string().optional(),
  educationRequired: z.string().optional(),
  skills: z.string().optional(),
  contactEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  contactPhone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobPostingFormProps {
  initialData?: Partial<JobFormValues> & { id?: string };
  isEditing?: boolean;
}

export function JobPostingForm({ initialData, isEditing = false }: JobPostingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const defaultValues: Partial<JobFormValues> = {
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    salary: 0,
    salaryType: 'MONTH',
    jobType: 'FULL_TIME',
    category: 'Event Management',
    isRemote: false,
    applicationDeadline: '',
    contactEmail: '',
    contactPhone: '',
    ...initialData,
  };

  // Convert arrays to strings for the form
  if (initialData?.requirements && Array.isArray(initialData.requirements)) {
    defaultValues.requirements = initialData.requirements.join('\n• ');
  }
  
  if (initialData?.responsibilities && Array.isArray(initialData.responsibilities)) {
    defaultValues.responsibilities = initialData.responsibilities.join('\n• ');
  }
  
  if (initialData?.benefits && Array.isArray(initialData.benefits)) {
    defaultValues.benefits = initialData.benefits.join('\n• ');
  }

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues,
  });

  async function onSubmit(data: JobFormValues) {
    setIsLoading(true);
    
    try {
      // Process the data before submitting
      const formData = {
        ...data,
        // Convert strings back to arrays
        requirements: data.requirements.split('\n').filter(Boolean).map(s => s.replace(/^•\s*/, '')),
        responsibilities: data.responsibilities.split('\n').filter(Boolean).map(s => s.replace(/^•\s*/, '')),
        benefits: data.benefits ? data.benefits.split('\n').filter(Boolean).map(s => s.replace(/^•\s*/, '')) : [],
      };
      
      // In a real app, you would send this to your API
      console.log('Submitting job:', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: isEditing ? 'Job updated!' : 'Job posted!',
        description: isEditing 
          ? 'Your job posting has been updated successfully.'
          : 'Your job has been posted successfully.',
      });
      
      // Redirect to jobs page after a short delay
      setTimeout(() => {
        router.push('/company/jobs');
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting job:', error);
      toast({
        title: 'Error',
        description: 'There was an error submitting your job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const jobTypes = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMPORARY', label: 'Temporary' },
    { value: 'INTERNSHIP', label: 'Internship' },
  ];

  const salaryTypes = [
    { value: 'HOUR', label: 'Per hour' },
    { value: 'DAY', label: 'Per day' },
    { value: 'WEEK', label: 'Per week' },
    { value: 'MONTH', label: 'Per month' },
    { value: 'PROJECT', label: 'Project-based' },
  ];

  const categories = [
    'Event Management',
    'Wedding Planning',
    'Catering',
    'Photography',
    'Videography',
    'Decor',
    'Entertainment',
    'Security',
    'Other',
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          {/* Basic Job Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Senior Event Manager" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of the job..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements *</FormLabel>
                  <FormDescription className="mb-2">
                    List each requirement on a new line. Start with a bullet point (•) for better formatting.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="• Minimum 3 years of experience\n• Excellent communication skills\n• Bachelor's degree in related field"
                      className="min-h-[120px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibilities *</FormLabel>
                  <FormDescription className="mb-2">
                    List each responsibility on a new line.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="• Plan and execute events\n• Coordinate with clients and vendors\n• Manage event budgets"
                      className="min-h-[120px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefits (Optional)</FormLabel>
                  <FormDescription className="mb-2">
                    List any benefits or perks you offer.
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="• Competitive salary\n• Health insurance\n• Flexible working hours"
                      className="min-h-[100px] font-mono"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Job Details */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Job Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Mumbai, India" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isRemote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a remote position</FormLabel>
                      <FormDescription>
                        Check if the job can be done remotely from anywhere.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary *</FormLabel>
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
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salaryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select salary type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salaryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicationDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Deadline *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="experienceRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Required</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 3-5 years"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Event Planning, Project Management, Communication"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="hr@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone *</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="+91 9876543210"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? 'Update Job' : 'Post Job'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
