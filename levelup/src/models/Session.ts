import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  date: Date;
  duration: number; // in minutes
  note: string;
  mood: 'great' | 'good' | 'okay' | 'tired' | 'frustrated';
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
    mood: { type: String, enum: ['great', 'good', 'okay', 'tired', 'frustrated'], default: 'good' },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1, date: -1 });
SessionSchema.index({ userId: 1, subjectId: 1 });

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export default Session;
