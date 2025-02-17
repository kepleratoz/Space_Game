function lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
    // Convert line to vector form
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Calculate vector from line start to circle center
    const fx = x1 - cx;
    const fy = y1 - cy;
    
    // Calculate quadratic equation coefficients
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - r * r;
    
    // Calculate discriminant
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        // No intersection
        return false;
    }
    
    // Calculate intersection points
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Check if intersection occurs within line segment
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}