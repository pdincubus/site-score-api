import type { Project } from '../types/project.js';

const projects: Project[] = [
    {
        id: '1',
        name: 'Crayons and Code',
        url: 'https://crayonsandco.de',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'National Pug Protection Trust',
        url: 'https://nationalpugprotectiontrust.org',
        createdAt: new Date().toISOString()
    }
];

export { projects };