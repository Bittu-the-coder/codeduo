import mongoose, { Document, Model, Schema } from 'mongoose';

// ── Types ──
export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  socketId: string;
  cursor: {
    line: number;
    column: number;
    filePath?: string;
  };
  color: string;
  displayName: string;
  joinedAt: Date;
}

export interface ISessionMethods {
  addParticipant(participant: IParticipant): void;
  removeParticipant(socketId: string): void;
  updateCursor(
    socketId: string,
    cursor: { line: number; column: number; filePath?: string }
  ): void;
}

export interface ISession extends Document, ISessionMethods {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  roomId: string;

  // Participants
  participants: IParticipant[];

  // State
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

// ── Sub-Schemas ──
const CursorSchema = new Schema(
  {
    line: { type: Number, default: 1 },
    column: { type: Number, default: 1 },
    filePath: { type: String },
  },
  { _id: false }
);

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
    cursor: {
      type: CursorSchema,
      default: () => ({ line: 1, column: 1 }),
    },
    color: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ── Main Schema ──
const SessionSchema = new Schema<ISession>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Participants
    participants: {
      type: [ParticipantSchema],
      default: [],
    },

    // State
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index is defined separately below
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
// roomId, projectId, expiresAt have index: true in field definition
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index (different config)
SessionSchema.index({ isActive: 1, lastActivityAt: -1 });

// ── Methods ──
SessionSchema.methods.addParticipant = function (participant: IParticipant) {
  // Check if already exists
  const existing = this.participants.find(
    (p: IParticipant) => p.userId.toString() === participant.userId.toString()
  );
  if (existing) {
    // Update socket ID
    existing.socketId = participant.socketId;
    existing.joinedAt = new Date();
  } else {
    this.participants.push(participant);
  }
  this.lastActivityAt = new Date();
};

SessionSchema.methods.removeParticipant = function (socketId: string) {
  this.participants = this.participants.filter(
    (p: IParticipant) => p.socketId !== socketId
  );
  this.lastActivityAt = new Date();

  // Mark inactive if no participants
  if (this.participants.length === 0) {
    this.isActive = false;
  }
};

SessionSchema.methods.updateCursor = function (
  socketId: string,
  cursor: { line: number; column: number; filePath?: string }
) {
  const participant = this.participants.find(
    (p: IParticipant) => p.socketId === socketId
  );
  if (participant) {
    participant.cursor = cursor;
    this.lastActivityAt = new Date();
  }
};

// ── Model ──
export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
