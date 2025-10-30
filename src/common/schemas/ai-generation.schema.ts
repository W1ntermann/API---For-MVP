import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'ai_generations'
})
export class AiGeneration extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, enum: ['text', 'image'] })
  type: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ type: Object })
  parameters?: Record<string, any>;

  @Prop()
  result_text?: string;

  @Prop()
  result_variants?: string[];

  @Prop()
  result_image_url?: string;

  @Prop()
  result_media_id?: string;

  @Prop({ default: 'pending', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @Prop()
  error_message?: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ default: Date.now })
  completed_at?: Date;
}

export const AiGenerationSchema = SchemaFactory.createForClass(AiGeneration);

// Індекси
AiGenerationSchema.index({ user_id: 1, type: 1 });
AiGenerationSchema.index({ user_id: 1, created_at: -1 });
AiGenerationSchema.index({ status: 1 });

