import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { getProjectOwnerId } from '../services/project-service.js';
import {
    createNewReport,
    deleteReportById,
    getReportById as getReportByIdFromService,
    getReportProjectOwnerId,
    getReportsByProjectId,
    updateReportById
} from '../services/report-service.js';

function isValidScore(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

async function getProjectReports(req: Request, res: Response) {
    const { id } = req.params;
    const reports = await getReportsByProjectId(id);

    res.status(200).json(reports);
}

async function getReportById(req: Request, res: Response) {
    const { id } = req.params;
    const report = await getReportByIdFromService(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(report);
}

async function createReport(req: Request, res: Response) {
    const { id: projectId } = req.params;
    const {
        title,
        summary,
        accessibilityScore,
        performanceScore,
        seoScore,
        uxScore
    } = req.body;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    if (typeof title !== 'string' || title.trim() === '') {
        throw new AppError('Title is required', 400);
    }

    if (typeof summary !== 'string' || summary.trim() === '') {
        throw new AppError('Summary is required', 400);
    }

    if (!isValidScore(accessibilityScore)) {
        throw new AppError('Accessibility score must be an integer between 0 and 100', 400);
    }

    if (!isValidScore(performanceScore)) {
        throw new AppError('Performance score must be an integer between 0 and 100', 400);
    }

    if (!isValidScore(seoScore)) {
        throw new AppError('SEO score must be an integer between 0 and 100', 400);
    }

    if (!isValidScore(uxScore)) {
        throw new AppError('UX score must be an integer between 0 and 100', 400);
    }

    const ownerId = await getProjectOwnerId(projectId);

    if (!ownerId) {
        throw new AppError('Project not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const report = await createNewReport({
        projectId,
        title,
        summary,
        accessibilityScore,
        performanceScore,
        seoScore,
        uxScore
    });

    res.status(201).json(report);
}

async function updateReport(req: Request, res: Response) {
    const { id } = req.params;
    const {
        title,
        summary,
        accessibilityScore,
        performanceScore,
        seoScore,
        uxScore
    } = req.body;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    if (
        title === undefined &&
        summary === undefined &&
        accessibilityScore === undefined &&
        performanceScore === undefined &&
        seoScore === undefined &&
        uxScore === undefined
    ) {
        throw new AppError('At least one report field is required', 400);
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        throw new AppError('Title must be a non-empty string', 400);
    }

    if (summary !== undefined && (typeof summary !== 'string' || summary.trim() === '')) {
        throw new AppError('Summary must be a non-empty string', 400);
    }

    if (accessibilityScore !== undefined && !isValidScore(accessibilityScore)) {
        throw new AppError('Accessibility score must be an integer between 0 and 100', 400);
    }

    if (performanceScore !== undefined && !isValidScore(performanceScore)) {
        throw new AppError('Performance score must be an integer between 0 and 100', 400);
    }

    if (seoScore !== undefined && !isValidScore(seoScore)) {
        throw new AppError('SEO score must be an integer between 0 and 100', 400);
    }

    if (uxScore !== undefined && !isValidScore(uxScore)) {
        throw new AppError('UX score must be an integer between 0 and 100', 400);
    }

    const ownerId = await getReportProjectOwnerId(id);

    if (!ownerId) {
        throw new AppError('Report not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const updatedReport = await updateReportById(id, {
        title,
        summary,
        accessibilityScore,
        performanceScore,
        seoScore,
        uxScore
    });

    if (!updatedReport) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(updatedReport);
}

async function deleteReport(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const ownerId = await getReportProjectOwnerId(id);

    if (!ownerId) {
        throw new AppError('Report not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const wasDeleted = await deleteReportById(id);

    if (!wasDeleted) {
        throw new AppError('Report not found', 404);
    }

    res.status(204).send();
}

export {
    createReport,
    deleteReport,
    getProjectReports,
    getReportById,
    updateReport
};