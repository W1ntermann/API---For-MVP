import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'sessions'
})
export class Session extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, unique: true, index: true })
  session_token: string;

  @Prop({ required: true, index: true })
  expires_at: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Індекси для очищення застарілих сесій
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });