#!/bin/bash

# Replace all occurrences of the cookie settings
sed -i 's/httpOnly: true/httpOnly: false/g' server/routes.ts
sed -i 's/secure: true/secure: process.env.NODE_ENV === "production"/g' server/routes.ts
sed -i 's/sameSite: "none"/sameSite: "lax"/g' server/routes.ts

echo "Cookie settings updated"
