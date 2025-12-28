import { supabase } from '@/lib/supabase';
import { Course } from '@/types/database';

export async function getCourses(year: string, speciality: string, moduleName: string, subDiscipline?: string) {
    try {
        let query = supabase
            .from('courses')
            .select('*')
            .eq('year', year)
            .eq('speciality', speciality)
            .eq('module_name', moduleName);

        if (subDiscipline) {
            query = query.eq('sub_discipline', subDiscipline);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;

        return {
            success: true,
            data: data.map(c => ({
                id: c.id,
                name: c.name,
                year: c.year,
                speciality: c.speciality,
                module_name: c.module_name,
                sub_discipline: c.sub_discipline,
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
    sub_discipline?: string;
}) {
    try {
        // Check if course already exists
        let query = supabase
            .from('courses')
            .select('id')
            .eq('name', course.name)
            .eq('year', course.year)
            .eq('speciality', course.speciality)
            .eq('module_name', course.module_name);

        if (course.sub_discipline) {
            query = query.eq('sub_discipline', course.sub_discipline);
        } else {
            query = query.is('sub_discipline', null);
        }

        const { data: existing } = await query.single();

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
                    sub_discipline: course.sub_discipline || null,
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
                sub_discipline: data.sub_discipline,
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
