import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// No seed data — feed starts empty
// Users post their own real projects
export async function seedFirestoreIfEmpty(ownerId, ownerName) {
  // Do nothing — let the feed start clean
  return
}