import mongoose, { Document, Schema, type ObjectId } from 'mongoose';

export interface EpisodeData {
  _id: ObjectId;
  title: String;
  orderToWatch: Number;
  releaseDate: Date;
  animeId: String;
}

const episodeSchema = new Schema({
  title: {
    type: String,
    trim: true,
  },
  orderToWatch: {
    type: Number,
    required: true,
    min: 0,
  },
  releaseDate: {
    type: Date,
    required: true,
  },
  animeId: {
    type: String,
    required: true,
    index: true,
  },
});

episodeSchema.index({ animeId: 1, orderToWatch: 1 }, { unique: true });

type EpisodeType = EpisodeData & Document;

const Episode = mongoose.model<EpisodeType>('Episode', episodeSchema);

export default Episode;
