import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Export extends Document {
  @Prop({ required: true })
  declare id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  template_id: string;

  @Prop({ default: 'png' })
  format: string;

  @Prop({ default: 1080 })
  width: number;

  @Prop({ default: 1080 })
  height: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  result_url?: string;

  @Prop()
  result_file_id?: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const ExportSchema = SchemaFactory.createForClass(Export);