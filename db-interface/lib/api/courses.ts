import { supabase } from '@/lib/supabase';
import { Course } from '@/types/database';

export async function getCourses(year: string, speciality: string, moduleName: string) {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('year', year)
            .eq('speciality', speciality)
            .eq('module_name', moduleName)
            .order('name');

        if (error) throw error;

        return {
            success: true,
            data: data.map(c => ({
                id: c.id,
                name: c.name,
                year: c.year,
                speciality: c.speciality,
                module_name: c.module_name,
                createdAt: new Date(c.created_at),
            })) as Course[],
        };
    } catch (error: any) {
        console.error('Error fetching courses:', error);
        return {
            success: false,
            error: error.message,
            data: [],
        };
    }
}

export async function createCourse(course: {
    name: string;
    year: string;
    speciality: string;
    module_name: string;
}) {
    try {
        // Check if course already exists
        const { data: existing } = await supabase
            .from('courses')
            .select('id')
            .eq('name', course.name)
            .eq('year', course.year)
            .eq('speciality', course.speciality)
            .eq('module_name', course.module_name)
            .single();

        if (existing) {
            return { success: true, data: existing };
        }

        const { data, error } = await supabase
            .from('courses')
            .insert([
                {
                    name: course.name,
                    year: course.year,
                    speciality: course.speciality,
                    module_name: course.module_name,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                year: data.year,
                speciality: data.speciality,
                module_name: data.module_name,
                createdAt: new Date(data.created_at),
            } as Course,
        };
    } catch (error: any) {
        console.error('Error creating course:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
