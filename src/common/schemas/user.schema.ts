import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ 
  timestamps: true,
  collection: 'users'
})
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  declare id: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: 'free' })
  subscription_plan: string;

  @Prop({ index: true })
  oauth_id?: string;

  @Prop()
  picture?: string;

  @Prop({ default: 100 })
  ai_credits: number;

  @Prop({ default: 100 })
  ai_credits_limit: number;

  @Prop()
  ai_credits_last_reset?: Date;

  @Prop({ default: Date.now })
  created_at: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Додаткові індекси
UserSchema.index({ email: 1, oauth_id: 1 });
UserSchema.index({ ai_credits_last_reset: 1 });