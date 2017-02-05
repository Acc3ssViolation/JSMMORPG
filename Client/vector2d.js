function Vector2(x, y)
{
	//return { x: x, y: y };
	this.x = x;
	this.y = y;
}

function v2SetLengthRect(vector, min, max)
{
	var x = (vector.x < min.x) ? min.x : (vector.x > max.x) ? max.x : vector.x;
	var y = (vector.y < min.y) ? min.y : (vector.y > max.y) ? max.y : vector.y;
	return new Vector2(x, y);
}

function v2Dot(a, b)
{
	return a.x * b.x + a.y * b.y;
}

function v2SetLength(vector, length)
{
	return v2Scale(vector, length / Math.sqrt(v2Dot(vector, vector)));
}

function v2Scale(vector, scale)
{
	return {
		x: vector.x * scale,
		y: vector.y * scale
	};
}

function v2Add(a, b)
{
	return {
		x: a.x + b.x,
		y: a.y + b.y
	};
}

function v2Subtract(a, b)
{
	return {
		x: a.x - b.x,
		y: a.y - b.y
	};
}

function v2Multiply(vector, fl)
{
	return {
		x: vector.x * fl,
		y: vector.y * fl
	};
}

function v2Difference(a, b)
{
	var c = v2Subtract(a, b);
	return Math.sqrt(v2Dot(c, c));
}