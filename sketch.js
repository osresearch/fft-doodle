"use strict"

let pts = [];
let samples_x = [];
let samples_y = [];
let prev_mouse_pressed = false;
let prev_mouseX = 0;
let prev_mouseY = 0;
let need_recompute = 0;
let need_resample = 0;
let fft, fft_x, fft_y;

let scale_x = 1;
let scale_y = 1;
let off_x = 0;
let off_y = 0;

function setup()
{
	const canvas = createCanvas(windowWidth-400, windowHeight-4);
	canvas.parent('sketch');
	frameRate(25);
	background(0);

	document.getElementById('input-form').addEventListener('submit', (e) => {
		e.preventDefault()
		need_recompute = 1;
	});
}

function windowResized()
{
	resizeCanvas(windowWidth-400, windowHeight-4);
	need_recompute = 1;
}

function reset_samples()
{
	pts = [];
	samples_x = [];
	samples_y = [];
	fft = null;
}

function draw()
{
	if (mouseIsPressed)
	{
		if (mouseX < 0 || mouseY < 0 || mouseX > width || mouseY > height)
			return;

		pts.push([mouseX, mouseY, prev_mouse_pressed]);

		// if prev_mouse_pressed, then this is a drag and
		// we should generate samples from the old point to this point
		if (prev_mouse_pressed)
		{
			const dx = mouseX - prev_mouseX;
			const dy = mouseY - prev_mouseY;
			const dist = sqrt(dx*dx + dy*dy);
			const step_size = 1;
			const steps = Math.floor(dist / step_size);
			let x = prev_mouseX;
			let y = prev_mouseY;
			for(let i = 0 ; i < steps ; i++)
			{
				samples_x.push([x/width,0]);
				samples_y.push([y/height,0]);
				x += dx / steps;
				y += dy / steps;
			}
		}

		need_recompute++;
	} else
	if (samples_x.length > 2 && need_recompute)
	{
		// compute the FFT for new samples when the mouse is released
		need_recompute = 0;
		need_resample = 1;
		fft_x = nj.fft(samples_x);
		fft_y = nj.fft(samples_y);

		// scale the DC component to match the width/height
		scale_x = width * 2 / samples_x.length;
		scale_y = height * 2 / samples_y.length;
		off_x = fft_x.get(0,0) * scale_x / 2;
		off_y = fft_y.get(0,0) * scale_y / 2;
	}

	prev_mouse_pressed = mouseIsPressed;
	prev_mouseX = mouseX;
	prev_mouseY = mouseY;

	background(0);

	// draw the actual samples
	fill(255);
	noStroke();
	for(let p of pts)
		rect(p[0]-2, p[1]-2, 5, 5);

	fill(0,255,0);
	for(let i = 0 ; i < samples_x.length ; i++)
		rect(samples_x[i][0]*width, samples_y[i][0]*height, 1, 1);

	if (need_resample)
	{
		const fft_count = Number(document.getElementById('fft-count').value);
		const sample_count = Number(document.getElementById('sample-count').value);
		need_resample = 0;
		fft = [];
		const out = document.getElementById('coefficients');
		let text = "xr,xi,yr,yi\n";
		for(let i = 1 ; i < fft_count ; i++)
		{
			const rx = (fft_x.get(i,0) * scale_x).toFixed(3);
			const ix = (fft_x.get(i,1) * scale_x).toFixed(3);
			const ry = (fft_y.get(i,0) * scale_y).toFixed(3);
			const iy = (fft_y.get(i,1) * scale_y).toFixed(3);
			text += rx +","+ ix +","+ ry +","+ iy + "\n";
		}
		out.innerHTML = text;

		for(let t = 0 ; t < 6.28 ; t += 6.28 / sample_count)
		{
			let x = 0;
			let y = 0;
			for(let i = 1 ; i < fft_count ; i++)
			{
				const rx = fft_x.get(i,0);
				const ix = fft_x.get(i,1);
				const ry = fft_y.get(i,0);
				const iy = fft_y.get(i,1);
				x += (rx * cos(t * i) + ix * sin(t*i)) * scale_x;
				y += (ry * cos(t * i) + iy * sin(t*i)) * scale_y;
			}

			fft.push([x,y]);
		}
	}

	if (fft)
	{
		push();
		translate(off_x, off_y);

		fill(255,0,255);
		for(let p of fft)
			rect(p[0]-2, p[1]-2, 5, 5);

		pop();
	}

	fill(10);
	textSize(120);
	textAlign(RIGHT, BOTTOM);
	text("fft-doodle", width, height);

}
