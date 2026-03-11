import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamGoalTask {
    text: string;
    isCompleted: boolean;
}

export interface ITeamGoal extends Document {
    user: 'Moksh' | 'smit';
    date: Date;
    timeJoinedOffice: string;
    // Legacy fields
    dailyGoals?: string;
    completedGoals?: string;
    // New checklist fields
    tasks: ITeamGoalTask[];
}

const TaskSchema = new Schema({
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
}, { _id: true }); // Give tasks IDs so we can toggle them easily

const TeamGoalSchema: Schema = new Schema({
    user: { type: String, enum: ['Moksh', 'smit'], required: true },
    date: { type: Date, required: true },
    timeJoinedOffice: { type: String, required: true }, // E.g. '09:00 AM'
    dailyGoals: { type: String, default: '' },
    completedGoals: { type: String, default: '' },
    tasks: { type: [TaskSchema], default: [] }
}, {
    timestamps: true,
});

// Ensure a user can only have one tracking record per day
TeamGoalSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.models.TeamGoal || mongoose.model<ITeamGoal>('TeamGoal', TeamGoalSchema);
