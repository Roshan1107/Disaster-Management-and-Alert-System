$randomInt = Get-Random -Minimum 1000 -Maximum 9999
$body = @{
    fullName = "Test User Script $randomInt"
    email = "script_user_$randomInt@example.com"
    phoneNumber = "9876543210"
    region = "Script City"
    password = "password123"
    role = "CITIZEN"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Registration Successful:"
    $response | Format-List
} catch {
    Write-Host "Registration Failed:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status Code: " $_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: " $reader.ReadToEnd()
    }
}
