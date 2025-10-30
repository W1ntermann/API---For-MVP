import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'exports'
})
export class Export extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, index: true })
  template_id: string;

  @Prop({ default: 'png' })
  format: string;

  @Prop({ default: 1080 })
  width: number;

  @Prop({ default: 1080 })
  height: number;

  @Prop({ default: 'pending', index: true })
  status: string;

  @Prop()
  result_url?: string;

  @Prop()
  result_file_id?: string;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const ExportSchema = SchemaFactory.createForClass(Export);

// Composite індекси
ExportSchema.index({ user_id: 1, status: 1 });
ExportSchema.index({ user_id: 1, created_at: -1 });