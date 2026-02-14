import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Types ──
export interface UserSettings {
  theme: 'dark' | 'light';
  editorFontSize: number;
  keybindings: 'default' | 'vim' | 'emacs';
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  passwordHash: string | null;
  displayName: string;
  avatarUrl: string;

  // OAuth
  githubId: string | null;
  googleId: string | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;

  // Preferences
  settings: UserSettings;

  // Relations (references)
  projects: mongoose.Types.ObjectId[];

  // Methods
  comparePassword(password: string): Promise<boolean>;
}

// ── Schema ──
const UserSettingsSchema = new Schema<UserSettings>(
  {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    editorFontSize: {
      type: Number,
      default: 14,
      min: 10,
      max: 32,
    },
    keybindings: {
      type: String,
      enum: ['default', 'vim', 'emacs'],
      default: 'default',
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens',
      ],
    },
    passwordHash: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    avatarUrl: {
      type: String,
      default: '',
    },

    // OAuth
    githubId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    // Metadata
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // Preferences
    settings: {
      type: UserSettingsSchema,
      default: () => ({}),
    },

    // Relations
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.passwordHash = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// ── Indexes ──
UserSchema.index({ email: 1, username: 1 });
// githubId and googleId have index: true + sparse: true in field definition
UserSchema.index({ createdAt: -1 });

// ── Methods ──
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, this.passwordHash);
};

// ── Static Methods ──
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

// ── Model ──
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
