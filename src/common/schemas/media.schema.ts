import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Media extends Document {
  @Prop({ required: true })
  declare id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  content_type: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  file_path: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);