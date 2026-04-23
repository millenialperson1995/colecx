import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Usuários de demo (em produção, isso viria de um banco de dados)
const DEMO_USERS = [
  {
    id: 'operator-1',
    email: 'demo@colecx.com',
    password: 'demo123456',
    name: 'Operador Demo',
    role: 'operator' as const,
  },
  {
    id: 'supervisor-1',
    email: 'supervisor@colecx.com',
    password: 'supervisor123456',
    name: 'Supervisor Demo',
    role: 'supervisor' as const,
  },
]

async function generateJWT(userId: string, email: string, name: string, role: string) {
  const token = await new SignJWT({
    email,
    name,
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(userId)
    .sign(JWT_SECRET)

  return token
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Valida entrada
    if (!email || !password) {
      return Response.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Procura o usuário (em produção, isso seria no banco de dados)
    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      return Response.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Gera JWT
    const token = await generateJWT(
      user.id,
      user.email,
      user.name,
      user.role
    )

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return Response.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    )
  }
}
