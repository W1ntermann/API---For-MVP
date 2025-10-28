import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Template extends Document {
  @Prop({ required: true })
  declare id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop()
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