import * as dashboardService from '../services/dashboardService.js'
import { sendSuccess, sendError } from '../utils/response.js'

export const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardSummary(req.user.id)
    return sendSuccess(res, 200, 'Dashboard summary fetched.', data)
  } catch (error) {
    console.error('[DASHBOARD SUMMARY ERROR]', error)
    return sendError(res, 500, 'Failed to fetch dashboard summary.')
  }
}

export const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const data  = await dashboardService.getSessionHistory(req.user.id, limit)
    return sendSuccess(res, 200, 'Session history fetched.', { sessions: data })
  } catch (error) {
    console.error('[DASHBOARD HISTORY ERROR]', error)
    return sendError(res, 500, 'Failed to fetch session history.')
  }
}

export const getTrend = async (req, res) => {
  try {
    const data = await dashboardService.getPerformanceTrend(req.user.id)
    return sendSuccess(res, 200, 'Performance trend fetched.', { trend: data })
  } catch (error) {
    console.error('[DASHBOARD TREND ERROR]', error)
    return sendError(res, 500, 'Failed to fetch performance trend.')
  }
}

export const getSkills = async (req, res) => {
  try {
    const data = await dashboardService.getSkillsAnalysis(req.user.id)
    return sendSuccess(res, 200, 'Skills analysis fetched.', data)
  } catch (error) {
    console.error('[DASHBOARD SKILLS ERROR]', error)
    return sendError(res, 500, 'Failed to fetch skills analysis.')
  }
}