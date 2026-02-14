import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Types ──
export type FileNodeType = 'file' | 'folder';
export type ProjectVisibility = 'private' | 'public' | 'unlisted';
export type CollaboratorRole = 'editor' | 'viewer';

export interface IFileNode {
  type: FileNodeType;
  name: string;
  path: string;
  content?: string; // Only for files
  language?: string; // Only for files (e.g., "cpp", "python")
  size?: number; // bytes
  children?: IFileNode[]; // Only for folders
}

export interface ICollaborator {
  userId: mongoose.Types.ObjectId;
  role: CollaboratorRole;
  addedAt: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;

  // Ownership
  ownerId: mongoose.Types.ObjectId;
  ownerUsername?: string; // Denormalized for display

  // Visibility
  visibility: ProjectVisibility;

  // File System (Nested structure)
  fileTree: IFileNode[];

  // Collaboration
  collaborators: ICollaborator[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt: Date;
  tags: string[];
  language: string; // Primary language

  // Stats
  forkCount: number;
  viewCount: number;
  starCount: number;

  // Thumbnail
  thumbnailUrl?: string;

  // Forked from (if applicable)
  forkedFrom?: mongoose.Types.ObjectId;
}

// ── Sub-Schemas ──
const FileNodeSchema = new Schema<IFileNode>(
  {
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Allow nested children for folders
FileNodeSchema.add({
  children: [FileNodeSchema],
});

const CollaboratorSchema = new Schema<ICollaborator>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ── Main Project Schema ──
const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Ownership
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerUsername: {
      type: String,
    },

    // Visibility
    visibility: {
      type: String,
      enum: ['private', 'public', 'unlisted'],
      default: 'public',
      index: true,
    },

    // File System
    fileTree: {
      type: [FileNodeSchema],
      default: [],
    },

    // Collaboration
    collaborators: {
      type: [CollaboratorSchema],
      default: [],
    },

    // Metadata
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    tags: {
      type: [String],
      index: true,
      default: [],
    },
    language: {
      type: String,
      default: 'cpp',
      index: true,
    },

    // Stats
    forkCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    starCount: {
      type: Number,
      default: 0,
    },

    // Optional
    thumbnailUrl: {
      type: String,
    },
    forkedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// ── Indexes ──
ProjectSchema.index({ ownerId: 1, createdAt: -1 });
ProjectSchema.index({ visibility: 1, createdAt: -1 });
// tags, language, fileTree.path have index: true in field definition
// Use language_override: 'searchLanguage' to prevent MongoDB from using 'language' field for text search
ProjectSchema.index(
  { title: 'text', description: 'text' },
  { language_override: 'searchLanguage', default_language: 'english' }
);
ProjectSchema.index({ 'collaborators.userId': 1 });

// ── Pre-save Hook ──
ProjectSchema.pre('save', function () {
  this.lastEditedAt = new Date();

  // Calculate total size
  const calculateSize = (nodes: IFileNode[]): void => {
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        node.size = Buffer.byteLength(node.content, 'utf-8');
      }
      if (node.children) {
        calculateSize(node.children);
      }
    }
  };

  if (this.fileTree) {
    calculateSize(this.fileTree);
  }
});

// ── Model ──
export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
