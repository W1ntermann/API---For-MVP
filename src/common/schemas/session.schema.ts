import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true })
  declare id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  session_token: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);