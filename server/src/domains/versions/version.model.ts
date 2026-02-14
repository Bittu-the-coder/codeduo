import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IFileNode } from '../projects/project.model.js';

// ── Types ──
export interface IProjectVersion extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  versionNumber: number;

  // Snapshot
  fileTreeSnapshot: IFileNode[];

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  message: string;
  tags: string[];
}

// ── File Node Schema (copied for snapshot) ──
const FileNodeSnapshotSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: String,
    size: Number,
  },
  { _id: false }
);

// Allow nested children
FileNodeSnapshotSchema.add({
  children: [FileNodeSnapshotSchema],
});

// ── Main Schema ──
const ProjectVersionSchema = new Schema<IProjectVersion>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },

    // Snapshot
    fileTreeSnapshot: {
      type: [FileNodeSnapshotSchema],
      required: true,
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    tags: {
      type: [String],
      default: [],
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
ProjectVersionSchema.index({ projectId: 1, versionNumber: -1 });
ProjectVersionSchema.index({ projectId: 1, createdAt: -1 });

// ── Static Method to Auto-Increment Version ──
ProjectVersionSchema.statics.getNextVersionNumber = async function (
  projectId: mongoose.Types.ObjectId
): Promise<number> {
  const lastVersion = await this.findOne({ projectId })
    .sort({ versionNumber: -1 })
    .select('versionNumber')
    .lean();

  return lastVersion ? lastVersion.versionNumber + 1 : 1;
};

// ── Model ──
export const ProjectVersion: Model<IProjectVersion> =
  mongoose.models.ProjectVersion ||
  mongoose.model<IProjectVersion>('ProjectVersion', ProjectVersionSchema);

export default ProjectVersion;
