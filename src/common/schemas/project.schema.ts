import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'projects'
})
export class Project extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Composite індекси для оптимізації запитів
ProjectSchema.index({ user_id: 1, created_at: -1 });
ProjectSchema.index({ user_id: 1, updated_at: -1 });