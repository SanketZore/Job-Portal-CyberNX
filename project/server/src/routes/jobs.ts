import express, { Request, Response } from 'express';
import Job from '../models/Job';
import { auth, checkRole } from '../middleware/auth';
import { IUser } from '../models/User';

const router = express.Router();

interface AuthRequest extends Request {
  user?: IUser;
}

interface JobQuery {
  $text?: { $search: string };
  location?: { $regex: string; $options: string };
  status?: string;
}

// Get all jobs (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, location, status } = req.query;
    const query: JobQuery = {};

    if (search) {
      query.$text = { $search: search as string };
    }

    if (location) {
      query.location = { $regex: location as string, $options: 'i' };
    }

    if (status) {
      query.status = status as string;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .populate('employer', 'name company');

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
});

// Get employer's jobs
router.get('/employer/jobs', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find({ employer: req.user?._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Fetch employer jobs error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching employer jobs'
    });
  }
});

// Get single job (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Fetch job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
});

// Create job (employer only)
router.post('/', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !type || !description || !requirements || !salary) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate salary structure
    if (!salary.min || !salary.max || !salary.currency) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid salary information'
      });
    }

    const job = new Job({
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      employer: req.user?._id,
      status: 'open',
    });

    await job.save();
    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error creating job'
    });
  }
});

// Update job (employer only)
router.put('/:id', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      employer: req.user?._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      status,
    } = req.body;

    // Update only provided fields
    if (title) job.title = title;
    if (company) job.company = company;
    if (location) job.location = location;
    if (type) job.type = type;
    if (description) job.description = description;
    if (requirements) job.requirements = requirements;
    if (salary) job.salary = salary;
    if (status) job.status = status;

    await job.save();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating job'
    });
  }
});

// Delete job (employer only)
router.delete('/:id', auth, checkRole(['employer']), async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      employer: req.user?._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting job'
    });
  }
});

export default router; 