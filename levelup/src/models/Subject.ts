import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  targetHours: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '📚' },
    color: { type: String, default: '#22c55e' },
    targetHours: { type: Number, default: 50 },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubjectSchema.index({ userId: 1, archived: 1 });

const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export default Subject;
