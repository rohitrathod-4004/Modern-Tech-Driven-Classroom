import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Lecture } from '../models/Lecture';
import { TranscriptChunk } from '../models/TranscriptChunk';
import { LectureQuiz } from '../models/LectureQuiz';
import { LectureFlashcard } from '../models/LectureFlashcard';

dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lecture-transcription';

const runSeed = async () => {
  const isReset = process.argv.includes('--reset');
  console.log(`[Seed] Starting in ${isReset ? 'RESET' : 'UPSERT'} mode`);

  try {
    await mongoose.connect(DB_URI);
    console.log('[Seed] Connected to MongoDB');

    if (isReset) {
      console.log('[Seed] Dropping collections for clean reset...');
      await User.deleteMany({ email: { $in: ['teacher@demo.com', 'student@demo.com'] } });
      await Course.deleteMany({ title: 'Introduction to Distributed Systems' });
      // Can't safely drop all lectures without orphan cleanup, so just drop those linked to demo course
    }

    // 1. Create or Update Users
    const passwordHash = await bcrypt.hash('password123', 10);

    let teacher = await User.findOne({ email: 'teacher@demo.com' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Demo Teacher',
        email: 'teacher@demo.com',
        passwordHash,
        role: 'teacher'
      });
      console.log('[Seed] Created demo teacher');
    }

    let student = await User.findOne({ email: 'student@demo.com' });
    if (!student) {
      student = await User.create({
        name: 'Demo Student',
        email: 'student@demo.com',
        passwordHash,
        role: 'student'
      });
      console.log('[Seed] Created demo student');
    }

    // 2. Create or Update Course
    let course = await Course.findOne({ title: 'Introduction to Distributed Systems' });
    if (!course) {
      course = await Course.create({
        title: 'Introduction to Distributed Systems',
        description: 'A comprehensive guide to building scalable distributed systems.',
        teacherId: teacher._id,
        students: [student._id]
      });
      console.log('[Seed] Created demo course');
    }

    // Ensure student is enrolled
    if (!student.enrolledCourses?.includes(course._id as any)) {
      student.enrolledCourses = student.enrolledCourses || [];
      student.enrolledCourses.push(course._id as any);
      await student.save();
    }
    // Ensure teacher has the course in enrolledCourses to act as a reference for the Dashboard fallback
    if (!teacher.enrolledCourses?.includes(course._id as any)) {
      teacher.enrolledCourses = teacher.enrolledCourses || [];
      teacher.enrolledCourses.push(course._id as any);
      await teacher.save();
    }

    // 3. Create or Update Lecture
    let lecture = await Lecture.findOne({ courseId: course._id, title: 'Understanding Consensus: Paxos and Raft' });
    if (!lecture) {
      lecture = await Lecture.create({
        courseId: course._id,
        teacherId: teacher._id,
        title: 'Understanding Consensus: Paxos and Raft',
        status: 'ready',
        aiStatus: 'completed',
        durationSeconds: 600, // 10 mins simulated
        chunkCount: 5,
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(Date.now() - 3000000),
        summary: {
          short: 'A deep dive into distributed consensus, contrasting the complexity of Paxos with the understandability of Raft.',
          detailed: 'In this lecture, we explore the fundamental challenges of reaching agreement in distributed systems. We discuss the CAP theorem\'s implications, analyze why Paxos is notoriously difficult to implement, and introduce Raft as a modern alternative designed explicitly for understandability. Key concepts include Leader Election, Log Replication, and Safety guarantees.'
        },
        topics: [
          {
            id: 't1',
            title: 'The Need for Consensus',
            startTime: 0,
            endTime: 120,
            summary: 'Why multiple nodes must agree on a single state to prevent split-brain scenarios.'
          },
          {
            id: 't2',
            title: 'Paxos: The Theoretical Foundation',
            startTime: 120,
            endTime: 300,
            summary: 'An overview of Leslie Lamport\'s Paxos algorithm and its implementation complexities.'
          },
          {
            id: 't3',
            title: 'Raft: Designed for Understandability',
            startTime: 300,
            endTime: 600,
            summary: 'How Raft simplifies consensus through strong leadership, leader election, and log replication.'
          }
        ]
      });
      console.log('[Seed] Created demo lecture');

      // Add realistic chunks
      await TranscriptChunk.insertMany([
        {
          lectureId: lecture._id,
          chunk_index: 0,
          start_time: 0,
          end_time: 60,
          session_id: 'seed-session-123',
          text: 'Welcome back everyone. Today we are tackling one of the most notoriously difficult problems in distributed systems: consensus. In a system with multiple independent nodes, how do we guarantee they all agree on the same shared state, even when networks partition or servers crash?',
          isFinal: true
        },
        {
          lectureId: lecture._id,
          chunk_index: 1,
          start_time: 60,
          end_time: 120,
          session_id: 'seed-session-123',
          text: 'If we look back at the CAP theorem, we know we have to trade off between consistency and availability in the presence of partitions. Consensus algorithms are what allow us to maintain strong consistency. Without them, we risk split-brain scenarios where different parts of our database think they hold the true state.',
          isFinal: true
        },
        {
          lectureId: lecture._id,
          chunk_index: 2,
          start_time: 120,
          end_time: 300,
          session_id: 'seed-session-123',
          text: 'For decades, Paxos was the gold standard. Leslie Lamport introduced it in 1989. However, Paxos is famously hard to understand. The original paper used an analogy of a Greek parliament. While mathematically beautiful, implementing Multi-Paxos in a real-world system like Google\'s Chubby or Apache ZooKeeper proved exceptionally complex.',
          isFinal: true
        },
        {
          lectureId: lecture._id,
          chunk_index: 3,
          start_time: 300,
          end_time: 450,
          session_id: 'seed-session-123',
          text: 'Because of this complexity, Diego Ongaro and John Ousterhout at Stanford developed Raft in 2013. Raft\'s primary design goal was understandability. It achieves consensus identically to Paxos, but it breaks the problem down into independent sub-problems: leader election, log replication, and safety.',
          isFinal: true
        },
        {
          lectureId: lecture._id,
          chunk_index: 4,
          start_time: 450,
          end_time: 600,
          session_id: 'seed-session-123',
          text: 'In Raft, time is divided into terms. A term begins with an election. If a candidate receives a majority of votes, it becomes the leader for that term. The leader accepts client requests, appends them to its log, and replicates them to followers. If the leader crashes, the followers eventually time out and trigger a new election.',
          isFinal: true
        }
      ]);

      // Add Quiz
      await LectureQuiz.create({
        lectureId: lecture._id,
        questions: [
          {
            id: 'q1',
            question: 'What was the primary design goal of the Raft consensus algorithm?',
            options: ['Maximum throughput', 'Understandability', 'Byzantine fault tolerance', 'Minimal latency'],
            answerIndex: 1,
            explanation: 'Raft was explicitly designed by Ongaro and Ousterhout to be easier to understand and implement than Paxos.',
            difficulty: 'easy'
          },
          {
            id: 'q2',
            question: 'In Raft, how is time fundamentally divided?',
            options: ['Into epochs', 'Into terms', 'Into ticks', 'Into synchrony bounds'],
            answerIndex: 1,
            explanation: 'In Raft, time is divided into terms, and each term begins with a leader election.',
            difficulty: 'medium'
          },
          {
            id: 'q3',
            question: 'What happens in Raft when a follower receives no communication from the leader?',
            options: ['It shuts down', 'It transitions to a candidate state and starts an election', 'It pings the client', 'It clears its log'],
            answerIndex: 1,
            explanation: 'If a follower times out waiting for a heartbeat from the leader, it assumes the leader has failed and initiates a new election.',
            difficulty: 'hard'
          }
        ]
      });

      // Add Flashcards
      await LectureFlashcard.create({
        lectureId: lecture._id,
        cards: [
          { id: 'c1', front: 'Consensus', back: 'The process of multiple distributed nodes agreeing on a single shared state or value.' },
          { id: 'c2', front: 'Split-Brain', back: 'A state where network partitions cause different nodes to believe they are the authoritative source of truth, leading to data corruption.' },
          { id: 'c3', front: 'Paxos', back: 'A foundational consensus algorithm introduced by Leslie Lamport, known for being mathematically sound but practically difficult to implement.' },
          { id: 'c4', front: 'Raft', back: 'A consensus algorithm designed for understandability, breaking the problem into leader election, log replication, and safety.' },
          { id: 'c5', front: 'Leader Election (Raft)', back: 'The phase in Raft where nodes vote for a single leader. Only a node with an up-to-date log can be elected.' }
        ]
      });
    }

    console.log('[Seed] Seed complete!');
  } catch (err) {
    console.error('[Seed] Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
