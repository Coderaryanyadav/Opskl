'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const talentSchema = z.object({
  role: z.literal('TALENT'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  aadhaarNumber: z.string().length(12, 'Aadhaar number must be 12 digits'),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  payExpectation: z.coerce.number().min(1, 'Please enter a valid amount'),
  payType: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'PROJECT']),
  location: z.string().min(2, 'Please enter your location'),
});

const companySchema = z.object({
  role: z.literal('COMPANY'),
  fullName: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  companyName: z.string().min(2, 'Company name is required'),
  gstNumber: z.string().min(15, 'Please enter a valid GST number'),
  industry: z.string().min(2, 'Please enter your industry'),
  location: z.string().min(2, 'Please enter your location'),
});

const registerSchema = z.discriminatedUnion('role', [talentSchema, companySchema]);

type FormData = z.infer<typeof registerSchema>;

const skills = [
  'Event Planning',
  'Cooking',
  'Photography',
  'Customer Service',
  'Security',
  'Cleaning',
  'Technical Support',
  'Hospitality',
];

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'talent' | 'company'>('talent');
  const { register } = useAuth();
  const router = useRouter();

  const {
    register: formRegister,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'TALENT',
      skills: [],
    },
  });

  const role = watch('role');

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      await register(data);
      toast({
        title: 'Account created',
        description: 'Your account has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const toggleSkill = (skill: string) => {
    const currentSkills = watch('role') === 'TALENT' ? watch('skills') || [] : [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    setValue('skills', newSkills, { shouldValidate: true });
  };

  return (
    <Tabs 
      defaultValue="talent" 
      className="w-full"
      onValueChange={(value) => {
        setActiveTab(value as 'talent' | 'company');
        setValue('role', value.toUpperCase() as 'TALENT' | 'COMPANY');
      }}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="talent">I'm Talent</TabsTrigger>
        <TabsTrigger value="company">I'm a Company</TabsTrigger>
      </TabsList>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TabsContent value="talent">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                disabled={isLoading}
                {...formRegister('fullName')}
              />
              {errors?.fullName && (
                <p className="px-1 text-xs text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                {...formRegister('email')}
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                {...formRegister('password')}
              />
              {errors?.password && (
                <p className="px-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                type="tel"
                disabled={isLoading}
                {...formRegister('phone')}
              />
              {errors?.phone && (
                <p className="px-1 text-xs text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
                placeholder="1234 5678 9012"
                disabled={isLoading}
                {...formRegister('aadhaarNumber')}
              />
              {errors?.aadhaarNumber && (
                <p className="px-1 text-xs text-red-600">
                  {errors.aadhaarNumber.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className={`px-3 py-1 text-sm rounded-full cursor-pointer ${
                      watch('skills')?.includes(skill)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </div>
                ))}
              </div>
              {errors?.skills && (
                <p className="px-1 text-xs text-red-600">
                  {errors.skills.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label htmlFor="payExpectation">Pay Expectation</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="payExpectation"
                    type="number"
                    className="pl-8"
                    placeholder="15000"
                    disabled={isLoading}
                    {...formRegister('payExpectation', { valueAsNumber: true })}
                  />
                </div>
                {errors?.payExpectation && (
                  <p className="px-1 text-xs text-red-600">
                    {errors.payExpectation.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1">
                <Label htmlFor="payType">Per</Label>
                <select
                  id="payType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  {...formRegister('payType')}
                >
                  <option value="HOUR">Hour</option>
                  <option value="DAY">Day</option>
                  <option value="WEEK">Week</option>
                  <option value="MONTH">Month</option>
                  <option value="PROJECT">Project</option>
                </select>
                {errors?.payType && (
                  <p className="px-1 text-xs text-red-600">
                    {errors.payType.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State"
                disabled={isLoading}
                {...formRegister('location')}
              />
              {errors?.location && (
                <p className="px-1 text-xs text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            <Button type="submit" className="mt-2" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Up as Talent
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="company">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                disabled={isLoading}
                {...formRegister('companyName')}
              />
              {errors?.companyName && (
                <p className="px-1 text-xs text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="fullName">Contact Person Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                disabled={isLoading}
                {...formRegister('fullName')}
              />
              {errors?.fullName && (
                <p className="px-1 text-xs text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="contact@company.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                {...formRegister('email')}
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                {...formRegister('password')}
              />
              {errors?.password && (
                <p className="px-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                type="tel"
                disabled={isLoading}
                {...formRegister('phone')}
              />
              {errors?.phone && (
                <p className="px-1 text-xs text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                placeholder="22AAAAA0000A1Z5"
                disabled={isLoading}
                {...formRegister('gstNumber')}
              />
              {errors?.gstNumber && (
                <p className="px-1 text-xs text-red-600">
                  {errors.gstNumber.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., IT, Manufacturing, Healthcare"
                disabled={isLoading}
                {...formRegister('industry')}
              />
              {errors?.industry && (
                <p className="px-1 text-xs text-red-600">
                  {errors.industry.message}
                </p>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State"
                disabled={isLoading}
                {...formRegister('location')}
              />
              {errors?.location && (
                <p className="px-1 text-xs text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            <Button type="submit" className="mt-2" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Register Company
            </Button>
          </div>
        </TabsContent>
      </form>
    </Tabs>
  );
}
