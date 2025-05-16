// Emergency test login system for when database connections are having issues
// This is just for testing purposes during development

export interface TestUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'client' | 'therapist' | 'admin';
  createdAt: Date;
}

// Therapist user for testing
export const TEST_THERAPIST: TestUser = {
  id: 20,
  username: "lcanady",
  email: "lcanady@resiliencec.com",
  name: "Linda Canady",
  role: "therapist",
  createdAt: new Date('2024-01-01')
};

// Check if credentials match our test user
export function checkTestCredentials(username: string, password: string): TestUser | null {
  // Allow login with either username or email
  if ((username === TEST_THERAPIST.username || username === TEST_THERAPIST.email) && 
      password === "123456") {
    return TEST_THERAPIST;
  }
  
  return null;
}