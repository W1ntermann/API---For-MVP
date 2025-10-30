import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'templates'
})
export class Template extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ index: true })
  project_id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, required: true })
  canvas_data: Record<string, any>;

  @Prop()
  thumbnail_url?: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// Composite індекси
TemplateSchema.index({ user_id: 1, project_id: 1 });
TemplateSchema.index({ user_id: 1, created_at: -1 });