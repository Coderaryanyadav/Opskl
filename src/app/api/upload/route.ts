import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';

// Increase the max body size for file uploads (default is 1MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const isValidFileType = Object.keys(ALLOWED_FILE_TYPES).includes(file.type);
    if (!isValidFileType) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large' },
        { status: 400 }
      );
    }

    // In a production environment, you would upload the file to a storage service
    // like AWS S3, Google Cloud Storage, or Azure Blob Storage.
    // For this example, we'll just return a mock URL.
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `uploads/${user.id}/${Date.now()}.${fileExt}`;
    
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would upload the file to your storage service here
    // For example, with AWS S3:
    // const fileBuffer = await file.arrayBuffer();
    // const uploadResult = await s3.upload({
    //   Bucket: process.env.AWS_BUCKET_NAME!,
    //   Key: fileName,
    //   Body: Buffer.from(fileBuffer),
    //   ContentType: file.type,
    // }).promise();
    
    // For now, we'll return a mock URL
    const fileUrl = `https://storage.example.com/${fileName}`;
    
    return NextResponse.json({ url: fileUrl });
    
  } catch (error) {
    console.error('File upload error:', error);
    const { error: message, status } = handleApiError(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
