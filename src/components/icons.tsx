import { 
  Loader2, 
  LucideProps, 
  Building, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  Send, 
  Edit, 
  Check, 
  File, 
  Trash, 
  Upload, 
  Twitter, 
  Linkedin, 
  Link as LinkIcon,
  User,
  Briefcase,
  Mail,
  Phone,
  Home,
  Settings,
  LogOut,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  FileText,
  FilePlus,
  FileCheck,
  FileX,
  FileSearch,
  FileUp,
  FileDown,
  Folder,
  FolderPlus,
  FolderOpen,
  FolderCheck,
  FolderX
} from 'lucide-react';

type Icon = React.FC<LucideProps>;

export const Icons = {
  // Loading
  spinner: Loader2 as Icon,
  
  // Authentication
  google: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  
  // Common UI
  building: Building as Icon,
  mapPin: MapPin as Icon,
  dollarSign: DollarSign as Icon,
  calendar: Calendar as Icon,
  clock: Clock as Icon,
  checkCircle: CheckCircle as Icon,
  x: X as Icon,
  send: Send as Icon,
  edit: Edit as Icon,
  check: Check as Icon,
  file: File as Icon,
  trash: Trash as Icon,
  upload: Upload as Icon,
  twitter: Twitter as Icon,
  linkedin: Linkedin as Icon,
  link: LinkIcon as Icon,
  user: User as Icon,
  briefcase: Briefcase as Icon,
  mail: Mail as Icon,
  phone: Phone as Icon,
  home: Home as Icon,
  settings: Settings as Icon,
  logOut: LogOut as Icon,
  search: Search as Icon,
  plus: Plus as Icon,
  chevronDown: ChevronDown as Icon,
  chevronRight: ChevronRight as Icon,
  chevronLeft: ChevronLeft as Icon,
  chevronUp: ChevronUp as Icon,
  xCircle: XCircle as Icon,
  checkCircle2: CheckCircle2 as Icon,
  alertTriangle: AlertTriangle as Icon,
  users: Users as Icon,
  userPlus: UserPlus as Icon,
  userCheck: UserCheck as Icon,
  userX: UserX as Icon,
  calendarIcon: CalendarIcon as Icon,
  clockIcon: ClockIcon as Icon,
  fileText: FileText as Icon,
  filePlus: FilePlus as Icon,
  fileCheck: FileCheck as Icon,
  fileX: FileX as Icon,
  fileSearch: FileSearch as Icon,
  fileUp: FileUp as Icon,
  fileDown: FileDown as Icon,
  folder: Folder as Icon,
  folderPlus: FolderPlus as Icon,
  folderOpen: FolderOpen as Icon,
  folderCheck: FolderCheck as Icon,
  folderX: FolderX as Icon,
};

export type IconName = keyof typeof Icons;
