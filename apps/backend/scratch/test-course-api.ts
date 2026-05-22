import { connectDB } from '../src/db/connection';
import mongoose from 'mongoose';
import { CourseService } from '../src/modules/course/course.service';

async function run() {
  await connectDB();
  
  const teacherId = '6a0f8929885196ea9ae8a0b1'; // demo teacher
  const studentId = '6a0f8929885196ea9ae8a0b2'; // demo student

  console.log('Testing Course Service...');

  try {
    console.log('1. Create Course');
    const course = await CourseService.createCourse(teacherId, 'Test Service Course', 'desc');
    console.log(course);
    const courseId = course.id;
    const code = course.enrollmentCode;

    console.log('2. Get Course');
    const fetched = await CourseService.getCourse(courseId, teacherId, 'teacher');
    console.log(fetched);

    console.log('3. Update Course');
    const updated = await CourseService.updateCourse(courseId, teacherId, { title: 'Updated Service Course' });
    console.log(updated);

    console.log('4. Join Course');
    const joined = await CourseService.joinCourse(studentId, code);
    console.log(joined);

    console.log('5. List Courses (Teacher)');
    const courses = await CourseService.listCourses(teacherId, 'teacher');
    console.log(`Found ${courses.length} courses`);

    console.log('6. Delete Course');
    const deleted = await CourseService.deleteCourse(courseId, teacherId);
    console.log(deleted);

    console.log('All Service Tests Passed!');
  } catch (err: any) {
    console.error('Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

run();

run();
