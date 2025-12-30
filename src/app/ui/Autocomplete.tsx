'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteProps {
    label: string;
    placeholder: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function Autocomplete({ label, placeholder, value, options = [], onChange, disabled }: AutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (!Array.isArray(options)) return;
        setFilteredOptions(
            options.filter(opt =>
                opt.toLowerCase().includes(inputValue.toLowerCase())
            )
        );
    }, [inputValue, options]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // On blur, revert to valid value if current input is not exact match
                // Or allow custom? Requirement says "filter", implies selection.
                // Assuming strict selection for now (or at least valid suggestions).
                // Actually, let's keep the typed value effectively, but if it doesn't match, it might filter nothing.
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInputValue('');
        onChange('');
        setFilteredOptions(options);
    };

    return (
        <div ref={wrapperRef} style={{ marginBottom: '1rem', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.3rem', color: 'hsl(var(--foreground))' }}>
                {label}
            </label>
            <div
                onClick={() => !disabled && setIsOpen(true)}
                style={{ position: 'relative', cursor: disabled ? 'not-allowed' : 'text' }}
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    disabled={disabled}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    style={{
                        width: '100%',
                        padding: '0.6rem 2rem 0.6rem 0.8rem',
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--input))',
                        fontSize: '0.9rem',
                        backgroundColor: disabled ? 'hsl(var(--muted))' : 'rgba(255, 255, 255, 0.5)',
                        color: 'hsl(var(--foreground))',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxShadow: 'none'
                    }}
                    className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />

                {/* Custom CSS focus styles as inline focus via pseudo is tricky in React inline styles without CSS modules/Tailwind */}
                <style jsx>{`
                    input:focus {
                        box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
                        border-color: hsl(var(--primary)) !important;
                        background-color: #fff !important;
                    }
                `}</style>


                {inputValue && !disabled && (
                    <div
                        onClick={handleClear}
                        style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}
                    >
                        <X size={14} />
                    </div>
                )}

                <div style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'hsl(var(--muted-foreground))' }}>
                    <ChevronDown size={14} />
                </div>
            </div>

            {isOpen && !disabled && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    zIndex: 50,
                    marginTop: '0.3rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px -1px rgba(0, 0, 0, 0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                style={{
                                    padding: '0.6rem 0.8rem',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    borderBottom: '1px solid hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                    backgroundColor: inputValue === opt ? 'hsl(var(--accent))' : 'transparent',
                                    transition: 'background-color 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = inputValue === opt ? 'hsl(var(--accent))' : 'transparent'}
                            >
                                {opt}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '0.8rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                            Aucun résultat
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
