/**
 * Static question bank — replaced by AI generation in the next phase.
 * Questions are organized by interview type and role.
 */
export const questionBank = {
  BEHAVIORAL: {
    default: [
      { content: "Tell me about yourself and your background.", category: "Introduction", difficulty: "easy" },
      { content: "Describe a time you faced a significant challenge at work. How did you handle it?", category: "Problem Solving", difficulty: "medium" },
      { content: "Tell me about a time you had to work with a difficult team member.", category: "Teamwork", difficulty: "medium" },
      { content: "Describe a situation where you had to meet a tight deadline.", category: "Time Management", difficulty: "medium" },
      { content: "Tell me about your greatest professional achievement.", category: "Achievement", difficulty: "medium" },
    ],
  },

  TECHNICAL: {
    "Software Engineer": [
      { content: "Explain the difference between an array and a linked list. When would you use each?", category: "Data Structures", difficulty: "medium" },
      { content: "What is Big O notation? Explain with an example.", category: "Algorithms", difficulty: "medium" },
      { content: "Explain the concept of RESTful APIs and their key principles.", category: "System Design", difficulty: "medium" },
      { content: "What is the difference between SQL and NoSQL databases?", category: "Databases", difficulty: "medium" },
      { content: "Explain how you would approach debugging a production issue.", category: "Problem Solving", difficulty: "hard" },
    ],
    default: [
      { content: "Walk me through your technical background and key skills.", category: "Introduction", difficulty: "easy" },
      { content: "Describe the most technically challenging project you have worked on.", category: "Experience", difficulty: "medium" },
      { content: "How do you stay updated with the latest technologies in your field?", category: "Learning", difficulty: "easy" },
      { content: "Explain a technical concept you recently learned.", category: "Knowledge", difficulty: "medium" },
      { content: "How do you approach code reviews?", category: "Best Practices", difficulty: "medium" },
    ],
  },

  SYSTEM_DESIGN: {
    default: [
      { content: "Design a URL shortening service like bit.ly. Walk me through your approach.", category: "System Design", difficulty: "hard" },
      { content: "How would you design a scalable chat application?", category: "System Design", difficulty: "hard" },
      { content: "Explain the trade-offs between SQL and NoSQL for a social media platform.", category: "Database Design", difficulty: "medium" },
      { content: "How would you design a caching system? What strategies would you use?", category: "Performance", difficulty: "hard" },
      { content: "Walk me through how you would design a rate limiter.", category: "System Design", difficulty: "hard" },
    ],
  },

  CASE_STUDY: {
    default: [
      { content: "Our user engagement has dropped 20% in the last month. How would you investigate and address this?", category: "Analytics", difficulty: "hard" },
      { content: "You have a limited budget to improve one feature of our product. How do you decide which one?", category: "Prioritization", difficulty: "medium" },
      { content: "How would you measure the success of a newly launched feature?", category: "Metrics", difficulty: "medium" },
      { content: "Walk me through how you would launch a new product in a competitive market.", category: "Strategy", difficulty: "hard" },
      { content: "A competitor just released a feature similar to ours. How do you respond?", category: "Strategy", difficulty: "hard" },
    ],
  },
}

/**
 * Get questions for a session based on type and role
 */
export const getQuestionsForSession = (interviewType, targetRole, count = 5) => {
  const typeBank = questionBank[interviewType] || questionBank.BEHAVIORAL
  const questions = typeBank[targetRole] || typeBank.default || []

  // Shuffle and return requested count
  return [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((q, index) => ({ ...q, orderIndex: index + 1 }))
}