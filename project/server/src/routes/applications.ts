import express, { Request, Response } from 'express';
import Application from '../models/Application';
import Job from '../models/Job';
import { auth, checkRole } from '../middleware/auth';
import { IUser } from '../models/User';
import { IJob } from '../models/Job';
import { Document, Types } from 'mongoose';

const router = express.Router();

interface AuthRequest extends Request {
  user?: IUser;
}

interface PopulatedJob {
  _id: Types.ObjectId;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salary: string;
  employer: {
    _id: Types.ObjectId;
    name: string;
    company: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedApplicant {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedApplicationData {
  _id: Types.ObjectId;
  jobId: PopulatedJob;
  applicantId: PopulatedApplicant;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter: string;
  resumeUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get all applications for a job (employer only)
router.get('/job/:jobId', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      employerId: req.user?._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('applicantId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Get job seeker's applications
router.get('/my-applications', auth, checkRole(['jobseeker']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const applications = await Application.find({ applicantId: req.user._id })
      .populate({
        path: 'jobId',
        select: 'title company location type description requirements salary employer status',
        populate: {
          path: 'employer',
          select: 'name company',
        },
      })
      .lean()
      .exec();

    if (!applications || applications.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => {
      if (!app.jobId) {
        console.error('Job not found for application:', app._id);
        return null;
      }

      const job = app.jobId as unknown as IJob & { _id: string };
      if (!job || !job._id) {
        console.error('Invalid job data for application:', app._id);
        return null;
      }

      return {
        _id: app._id.toString(),
        jobId: job._id.toString(),
        job: {
          _id: job._id.toString(),
          title: job.title || 'Unknown',
          company: job.company || 'Unknown',
          location: job.location || 'Unknown',
          type: job.type || 'Unknown',
          description: job.description || '',
          requirements: job.requirements || [],
          salary: job.salary || '',
          employer: job.employer?._id?.toString() || 'Unknown',
          status: job.status || 'unknown',
          createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : new Date().toISOString()
        },
        applicantId: app.applicantId.toString(),
        status: app.status || 'pending',
        coverLetter: app.coverLetter || '',
        resumeUrl: app.resumeUrl || '',
        createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : new Date().toISOString()
      };
    }).filter(Boolean); // Remove any null entries

    res.json({
      success: true,
      data: transformedApplications
    });
  } catch (error) {
    console.error('Fetch my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit application (job seeker only)
router.post('/', auth, checkRole(['jobseeker']), async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, coverLetter, resumeUrl } = req.body;

    if (!jobId || !coverLetter || !resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if job exists and is active
    const existingJob = await Job.findOne({ _id: jobId, status: 'open' });
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not open'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      applicantId: req.user?._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied for this job'
      });
    }

    const application = new Application({
      jobId,
      applicantId: req.user?._id,
      coverLetter,
      resumeUrl,
    });

    await application.save();
    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application'
    });
  }
});

// Update application status (employer only)
router.patch('/:id/status', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    // First check if the application exists
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Then check if the job belongs to the employer
    const job = await Job.findOne({
      _id: application.jobId,
      employer: req.user?._id
    });

    if (!job) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this application'
      });
    }

    // Update the application status
    application.status = status;
    await application.save();

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status'
    });
  }
});

// Withdraw application (job seeker only)
router.delete('/:id', auth, checkRole(['jobseeker']), async (req: AuthRequest, res: Response) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      applicantId: req.user?._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application'
    });
  }
});

// Get all applications for employer's jobs
router.get('/employer/applications', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('Fetching applications for employer:', req.user._id); // Debug log

    // First get all jobs posted by this employer
    const jobs = await Job.find({ employer: req.user._id }).select('_id');
    console.log('Found jobs:', jobs); // Debug log
    
    const jobIds = jobs.map(job => job._id);
    console.log('Job IDs:', jobIds); // Debug log

    // Then get all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate({
        path: 'jobId',
        select: 'title company location type description requirements salary employer status',
        populate: {
          path: 'employer',
          select: 'name company',
        },
      })
      .populate('applicantId', 'name email')
      .lean()
      .exec();

    console.log('Found applications:', applications); // Debug log

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => {
      const job = app.jobId as unknown as IJob & { _id: Types.ObjectId };
      const applicant = app.applicantId as unknown as IUser & { _id: Types.ObjectId };
      
      return {
        _id: app._id.toString(),
        jobId: job._id.toString(),
        job: {
          _id: job._id.toString(),
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          description: job.description,
          requirements: job.requirements,
          salary: job.salary,
          employer: job.employer._id.toString(),
          status: job.status,
          createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : new Date().toISOString()
        },
        applicantId: applicant._id.toString(),
        applicant: {
          _id: applicant._id.toString(),
          name: applicant.name,
          email: applicant.email
        },
        status: app.status,
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : new Date().toISOString()
      };
    });

    console.log('Transformed applications:', transformedApplications); // Debug log

    res.json({
      success: true,
      data: transformedApplications
    });
  } catch (error) {
    console.error('Fetch employer applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single application by ID (employer only)
router.get('/:id', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'jobId',
        select: 'title company location type description requirements salary employer status',
        populate: {
          path: 'employer',
          select: 'name company',
        },
      })
      .populate('applicantId', 'name email')
      .lean()
      .exec() as PopulatedApplicationData | null;

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if the job belongs to the employer
    const job = await Job.findOne({
      _id: application.jobId._id,
      employer: req.user?._id
    });

    if (!job) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this application'
      });
    }

    // Transform the data to match the expected format
    const transformedApplication = {
      _id: application._id.toString(),
      jobId: application.jobId._id.toString(),
      job: {
        _id: application.jobId._id.toString(),
        title: application.jobId.title,
        company: application.jobId.company,
        location: application.jobId.location,
        type: application.jobId.type,
        description: application.jobId.description,
        requirements: application.jobId.requirements,
        salary: application.jobId.salary,
        employer: application.jobId.employer._id.toString(),
        status: application.jobId.status,
        createdAt: application.jobId.createdAt ? new Date(application.jobId.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: application.jobId.updatedAt ? new Date(application.jobId.updatedAt).toISOString() : new Date().toISOString()
      },
      applicantId: application.applicantId._id.toString(),
      applicant: {
        _id: application.applicantId._id.toString(),
        name: application.applicantId.name,
        email: application.applicantId.email
      },
      status: application.status,
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      createdAt: application.createdAt ? new Date(application.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: application.updatedAt ? new Date(application.updatedAt).toISOString() : new Date().toISOString()
    };

    res.json({
      success: true,
      data: transformedApplication
    });
  } catch (error) {
    console.error('Fetch application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application'
    });
  }
});

export default router; 